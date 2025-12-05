import { useEffect, useRef, useState, useCallback } from "react";
import * as go from "gojs";
import Sidebar from "./Sidebar";
import "./Diagram.css";
import { useParams, useNavigate } from "react-router-dom";

import { createGroupTemplate } from "./GroupTemplate";
import { createNodeTemplate } from "./NodeTemplate";
import { createLinkTemplate } from "./LinkTemplate";

const Diagram = () => {
  const $ = go.GraphObject.make;
  const diagramRef = useRef(null);
  const myDiagramRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // === State ===
  const [editingNode, setEditingNode] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveFormData, setSaveFormData] = useState({ flowName: "", flowDescription: "" });
  const [editingLink, setEditingLink] = useState(null);
  // const [layoutDirection, setLayoutDirection] = useState("Horizontal");
  const [linkFormData, setLinkFormData] = useState({
    routing: "Normal",
    curve: "None",
    animated: true,
    color: "#4CAF50",
    label: "",
    arrow: "Standard",
  });

  // === Port Creation ===
  const makePort = useCallback((name, spot, output, input) => {
    return $(
      go.Shape,
      "Circle",
      {
        fill: "transparent",
        stroke: null,
        desiredSize: new go.Size(8, 8),
        alignment: spot,
        alignmentFocus: spot,
        portId: name,
        fromSpot: spot,
        toSpot: spot,
        fromLinkable: output,
        toLinkable: input,
        cursor: "pointer",
        mouseEnter: (_, port) => (port.fill = "rgba(0,0,0,.3)"),
        mouseLeave: (_, port) => (port.fill = "transparent"),
      }
    );
  }, []);

  // === Handlers ===
  const handleEditNode = useCallback((node) => {
    setEditingNode(node);
    setFormData({ name: node.data.text || "", description: node.data.description || "" });
  }, []);

  const handleDeleteNode = useCallback((node) => {
    const diagram = myDiagramRef.current;
    if (!diagram || !node) return;
    diagram.startTransaction("deleteNode");
    diagram.remove(node);
    diagram.commitTransaction("deleteNode");
  }, []);

  const handleLinkClick = useCallback((data) => {
    setLinkFormData({
      routing: data.routing || "Normal",
      curve: data.curve || "None",
      animated: data.animated ?? true,
      color: data.color || "#4CAF50",
      label: data.label || "",
      arrow: data.arrow || "Standard",
    });
    setEditingLink(data);
  }, []);

  // === Diagram Setup ===
  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, diagramRef.current, {
      "undoManager.isEnabled": true,
      "animationManager.isEnabled": true,
      initialContentAlignment: go.Spot.TopLeft,
      "animationManager.duration": 800,
      padding: 20,
      layout:new go.Layout({isInitial: false,isOngoing:false}),
    });

    // Templates
    diagram.groupTemplate = createGroupTemplate(diagram, { handleEditNode, handleDeleteNode });
    diagram.nodeTemplate = createNodeTemplate(makePort, handleEditNode, handleDeleteNode);
    diagram.linkTemplate = createLinkTemplate(handleLinkClick);

    // Grid
    diagram.grid = $(
      go.Panel,
      "Grid",
      { gridCellSize: new go.Size(40, 40) },
      $(go.Shape, "LineH", { stroke: "#e0e0e0", strokeWidth: 0.5 }),
      $(go.Shape, "LineV", { stroke: "#e0e0e0", strokeWidth: 0.5 })
    );

    diagram.toolManager.draggingTool.isGridSnapEnabled = true;
    diagram.toolManager.draggingTool.gridSnapCellSize = new go.Size(40, 40);

    // Model
    const model = new go.GraphLinksModel();
    model.nodeKeyProperty = "key";
    model.linkFromKeyProperty = "from";
    model.linkToKeyProperty = "to";
    diagram.model = model;

    // === Save expanded size when group is resized (only when expanded) ===
    diagram.addDiagramListener("PartResized", (e) => {
      const part = e.subject.part;
      if (!(part instanceof go.Group) || !part.isSubGraphExpanded) return;

      const shape = part.findObject("SHAPE");
      if (!shape) return;

      const sizeStr = go.Size.stringify(shape.desiredSize);
      diagram.model.setDataProperty(part.data, "expandedSize", sizeStr);
      diagram.model.setDataProperty(part.data, "size", sizeStr);
    });

    myDiagramRef.current = diagram;

    // === Drag & Drop from Sidebar ===
    const div = diagram.div;
    const handleDrop = (e) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/my-node");
      if (!data) return;
      const nodeData = JSON.parse(data);
      const pt = diagram.transformViewToDoc(
        new go.Point(
          e.clientX - div.getBoundingClientRect().left,
          e.clientY - div.getBoundingClientRect().top
        )
      );

      diagram.startTransaction("drop");
      if (nodeData.type === "Group") {
        diagram.model.addNodeData({
          key: Date.now(),
          isGroup: true,
          text: nodeData.text || "New Group",
          isSubGraphExpanded: true,
          // isCollapsed: false,
          expandedSize: "500 350",
          size: "500 350",
          loc: go.Point.stringify(pt),
        });
      } else {
        diagram.model.addNodeData({
          key: Date.now(),
          text: nodeData.text || "New Node",
          type: nodeData.type,
          color: "#d3e6f5",
          shape: nodeData.type === "Decision" ? "Diamond" : "RoundedRectangle",
          description: "",
          loc: go.Point.stringify(pt),
        });
      }
      diagram.commitTransaction("drop");
    };

    div.addEventListener("dragover", (e) => e.preventDefault());
    div.addEventListener("drop", handleDrop);

    return () => {
      div.removeEventListener("dragover", () => {});
      div.removeEventListener("drop", handleDrop);
      diagram.div = null;
      myDiagramRef.current = null;
    };
  }, [makePort, handleEditNode, handleDeleteNode, handleLinkClick]);

  // === Load Flow ===
  useEffect(() => {
    if (!id || !myDiagramRef.current) return;
    const flows = JSON.parse(localStorage.getItem("Flows") || "[]");
    const flow = flows.find((f) => f.id === id);
    if (flow) {
      setSaveFormData({ flowName: flow.flowName, flowDescription: flow.flowDescription });
      const model = new go.GraphLinksModel(flow.nodes, flow.links);
      model.nodeKeyProperty = "key";
      model.linkFromKeyProperty = "from";
      model.linkToKeyProperty = "to";
      myDiagramRef.current.model = model;
      myDiagramRef.current.updateAllTargetBindings();

      // No extra updateTargetBindings needed — GoJS handles isSubGraphExpanded perfectly
    }
  }, [id]);
  // const applyLayout = useCallback(()=>{
  //   const diagram = myDiagramRef.current;
  //   if (!diagram) return;
  //   diagram.startTransaction("Change layout");
  //   if(layoutDirection==="Horizontal"){
  //     diagram.layout = new go.TreeLayout({
  //       angle :0,
  //       layerSpacing: 50,
  //     })
  //   } else {
  //     diagram.layout = new go.TreeLayout({
  //       angle :90,
  //       layerSpacing: 50,
  //     })
  //   }
  //   diagram.layoutDiagram(true);
  //   diagram.commitTransaction("Change layout");
     
  // },[layoutDirection]);

  // useEffect(()=>{
  //   applyLayout();
  // },[layoutDirection,applyLayout]);

  // === Save Flow ===
  
  const applyHorizontalLayout=()=>{
    const diagram = myDiagramRef.current;
    if(!diagram) return;

    diagram.startTransaction("horizontal-layout");
    diagram.layout=$(go.TreeLayout,{
      angle:0,
      layerSpacing:60,
      arrangement:go.TreeLayout.ArrangementFixedRoots
    });

    diagram.nodes.each(node=>{
      if(node instanceof go.Group){
        node.layout=$(go.TreeLayout,{
          angle:0,
          layerSpacing:60,
          arrangement:go.TreeLayout.ArrangementFixedRoots
        })
      node.layout.invalidateLayout();
      }
    })
    diagram.layoutDiagram(true);
    diagram.commitTransaction("horizontal-layout");
  };

  const applyVerticalLayout=()=>{
    const diagram=myDiagramRef.current;
    if(!diagram) return;

    diagram.startTransaction("vertical-layout");

    diagram.layout =$(go.TreeLayout,{
      angle:90,
      layerSpacing:60,
      arrangement:go.TreeLayout.ArrangementFixedRoots
    });

    diagram.nodes.each(node=>{
      if(node instanceof go.Group){
        node.layout=$(go.TreeLayout,{
          angle:90,
          layerSpacing:60,
          arrangement:go.TreeLayout.ArrangementFixedRoots
        })
        node.layout.invalidateLayout();
      }
    })
    diagram.layoutDiagram(true);
    diagram.commitTransaction("vertical-layout");
  }

  const saveOrUpdateFlow = (flow) => {
    let flows = JSON.parse(localStorage.getItem("Flows") || "[]");
    flows = flows.filter((f) => f.id !== flow.id);
    flows.unshift(flow);
    localStorage.setItem("Flows", JSON.stringify(flows));
    window.dispatchEvent(new CustomEvent("flows-updated"));
  };

  const handleSubmitSaveForm = (e) => {
    e.preventDefault();
    const diagram = myDiagramRef.current;
    if (!diagram) return;

    const data = {
      id: id || "flow-" + Date.now(),
      flowName: saveFormData.flowName,
      flowDescription: saveFormData.flowDescription,
      nodes: diagram.model.nodeDataArray,
      links: diagram.model.linkDataArray,
    };

    saveOrUpdateFlow(data);
    alert(id ? "Flow updated!" : "Flow saved!");
    setShowSaveForm(false);
    navigate("/flows");
  };

  const handleUpdateNode = (e) => {
    e.preventDefault();
    const diagram = myDiagramRef.current;
    if (!diagram || !editingNode) return;
    diagram.startTransaction("updateNode");
    diagram.model.setDataProperty(editingNode.data, "text", formData.name);
    diagram.model.setDataProperty(editingNode.data, "description", formData.description);
    diagram.commitTransaction("updateNode");
    setEditingNode(null);
  };

  return (
    <div className="container">
      <Sidebar onSave={() => setShowSaveForm(true)} id={id} 
      onHorizontal={applyHorizontalLayout}
      onVertical={applyVerticalLayout}
      />
      <div ref={diagramRef} className="diagram-area" />

      {/* Node Edit Modal */}
      {editingNode && (
        <div className="modal">
          <h3>Edit Node</h3>
          <form onSubmit={handleUpdateNode}>
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="button-row">
              <button type="submit">Update</button>
              <button type="button" onClick={() => setEditingNode(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Save Flow Modal */}
      {showSaveForm && (
        <div className="modal">
          <h3>{id ? "Update Flow" : "Save New Flow"}</h3>
          <form onSubmit={handleSubmitSaveForm}>
            <label>Flow Name:</label>
            <input
              type="text"
              value={saveFormData.flowName}
              onChange={(e) => setSaveFormData({ ...saveFormData, flowName: e.target.value })}
              required
            />
            <label>Description:</label>
            <textarea
              value={saveFormData.flowDescription}
              onChange={(e) => setSaveFormData({ ...saveFormData, flowDescription: e.target.value })}
              required
            />
            <div className="button-row">
              <button type="submit">{id ? "Update" : "Save"}</button>
              <button type="button" onClick={() => setShowSaveForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Link Editing */}
      {editingLink && (
        <div className="modal link-editor">
          <div className="modal-content">
            <h2>Edit Link Style</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const diagram = myDiagramRef.current;
                if (!diagram) return;
                diagram.startTransaction("updateLink");
                Object.entries(linkFormData).forEach(([key, val]) => diagram.model.setDataProperty(editingLink, key, val));
                diagram.commitTransaction("updateLink");
                setEditingLink(null);
              }}
            >
              <div className="form-row">
                <label>Routing:</label>
                <select value={linkFormData.routing} onChange={(e) => setLinkFormData({ ...linkFormData, routing: e.target.value })}>
                  <option value="Normal">Normal</option>
                  <option value="Orthogonal">Orthogonal</option>
                  <option value="AvoidsNodes">Avoids Nodes</option>
                </select>
              </div>

              <div className="form-row">
                <label>Curve:</label>
                <select value={linkFormData.curve} onChange={(e) => setLinkFormData({ ...linkFormData, curve: e.target.value })}>
                  <option value="None">None</option>
                  <option value="Bezier">Bezier</option>
                  <option value="JumpOver">Jump Over</option>
                </select>
              </div>

              <div className="form-row">
                <label>Arrow Style:</label>
                <select value={linkFormData.arrow} onChange={(e) => setLinkFormData({ ...linkFormData, arrow: e.target.value })}>
                  <option value="Standard">Standard</option>
                  <option value="Triangle">Triangle</option>
                  <option value="Circle">Circle</option>
                  <option value="DoubleTriangle">Double Triangle</option>
                  <option value="Backward">Backward</option>
                  <option value="OpenTriangle">Open Triangle</option>
                </select>
              </div>

              <div className="form-row">
                <label>Color:</label>
                <input type="color" value={linkFormData.color} onChange={(e) => setLinkFormData({ ...linkFormData, color: e.target.value })} />
              </div>

              <div className="form-row">
                <label>Label:</label>
                <input type="text" placeholder="Enter link label" value={linkFormData.label} onChange={(e) => setLinkFormData({ ...linkFormData, label: e.target.value })} />
              </div>

              <div className="button-row">
                <button type="submit" className="btn save">Save</button>
                <button type="button" className="btn cancel" onClick={() => setEditingLink(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn delete"
                  style={{ backgroundColor: "red" }}
                  onClick={() => {
                    const diagram = myDiagramRef.current;
                    if (!diagram) return;
                    diagram.startTransaction("deleteLink");
                    diagram.remove(diagram.findLinkForData(editingLink));
                    diagram.commitTransaction("deleteLink");
                    setEditingLink(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diagram;