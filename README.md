# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.





goJS without using DesiredSize, "size"  :
--------------------------------------------


import { useEffect, useRef, useState, useCallback } from "react";
import * as go from "gojs";
import Sidebar from "./Sidebar";
import "./Diagram.css";
import { useParams, useNavigate } from "react-router-dom";

const Diagram = () => {
  const diagramRef = useRef(null);
  const myDiagramRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  

  const [editingNode, setEditingNode] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveFormData, setSaveFormData] = useState({ flowName: "", flowDescription: "" });
  const [editingLink, setEditingLink] = useState(null);
  const [linkFormData, setLinkFormData] = useState({
    routing: "Normal",
    curve: "None",
    // dashed: false,
    animated: true,
    color: "#4CAF50",
    label: "",
    arrow: "Standard",
  });

  //  ports
  const makePort = useCallback((name, spot, output, input) => {
    const $ = go.GraphObject.make;
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

  //  Handlers
  const handleEditNode = useCallback((node) => {
    setEditingNode(node);
    setFormData({
      name: node.data.text || "",
      description: node.data.description || "",
    });
  }, []);

  const handleDeleteNode = useCallback((node) => {
    const diagram = myDiagramRef.current;
    diagram.startTransaction("deleteNode");
    diagram.remove(node);
    diagram.commitTransaction("deleteNode");
  }, []);

  const handleLinkClick = useCallback((data) => {
  setLinkFormData({
    routing: data.routing || "Normal",
    curve: data.curve || "None",
    // dashed: data.dashed || false,
    animated: data.animated ?? true,
    color: data.color || "#4CAF50",
    label: data.label || "",
    arrow: data.arrow || "Standard",
  });
  setEditingLink(data);
}, []);

  //  Diagram initialization
  useEffect(() => {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, diagramRef.current, {
      "undoManager.isEnabled": true,
      allowDrop: true,
      initialContentAlignment: go.Spot.TopLeft,
      "animationManager.isEnabled": false,
      "linkingTool.isEnabled": true,
      "linkReshapingTool.isEnabled": true,
      "relinkingTool.isEnabled": true,
      padding: 10,
    });

    myDiagramRef.current = diagram;
    
    //  Updated toggleGroupCollapse
    const toggleGroupCollapse = (group, collapse) => {
    if (!group) return;
    diagram.startTransaction("toggleCollapse");
    diagram.model.setDataProperty(group.data, "isCollapsed", collapse);

    if (collapse) {
    //  Hide all child nodes and links
    group.memberParts.each((part) => {
      if (part instanceof go.Node || part instanceof go.Link) part.visible = false;
    });

    //  Automatically resize the group smaller when collapsed
    const shape = group.findObject("SHAPE");
    if (shape) {
      shape.desiredSize = new go.Size(120, 100); // collapsed size
      console.log("collapsed data:",group.data)
    }

    //  Optional: adjust placeholder visibility
    const placeholder = group.findObject("PLACEHOLDER");
    if (placeholder) placeholder.visible = false;

  } else {
    //  Expand back to fit contents
    group.memberParts.each((part) => {
      if (part instanceof go.Node || part instanceof go.Link) part.visible = true;
    });

    const shape = group.findObject("SHAPE");
    if (shape) {
      shape.desiredSize = new go.Size(NaN, NaN); // auto-fit again
      console.log("expanded data:",group.data)
    }

    const placeholder = group.findObject("PLACEHOLDER");
    if (placeholder) placeholder.visible = true;
  }

  //  Update binding so count text updates correctly
  // diagram.model.updateTargetBindings(group.data);
  // group.location = group.location.copy();

  diagram.commitTransaction("toggleCollapse");
};


    // Background grid
    diagram.background = "#ffffff";
    diagram.grid = $(
      go.Panel,
      "Grid",
      { gridCellSize: new go.Size(40, 40) },
      $(go.Shape, "LineH", { stroke: "#ccc", strokeWidth: 1 }),
      $(go.Shape, "LineV", { stroke: "#ccc", strokeWidth: 1 })
    );

    diagram.toolManager.draggingTool.isGridSnapEnabled = true;
    diagram.toolManager.draggingTool.gridSnapCellSize = new go.Size(40, 40);

    // Group Template
    diagram.groupTemplate = $(
      go.Group,
      "Auto",
      {
        background: "transparent",
        ungroupable: true,
        computesBoundsAfterDrag: true,
        handlesDragDropForMembers: true,
        resizable: true,                        
        resizeObjectName: "SHAPE",
        minSize: new go.Size(120, 100),       
         
        mouseDrop: (e, grp) => {
          if (grp.data.isCollapsed) return;
          const sel = grp.diagram.selection;
          console.log("grp data",grp.data)
          console.log("Dropped on group:", sel);
          grp.diagram.startTransaction("addToGroup");
          sel.each((part) => {
            if (part instanceof go.Node && !part.data.isGroup) {
              grp.diagram.model.setDataProperty(part.data, "group", grp.data.key);
              console.log(`${part.data.text} : ${grp.data.text}`);
            }
          });
          grp.diagram.commitTransaction("addToGroup");
        },

        mouseDragEnter: (_, grp) => {
          if(grp.data.isCollapsed) return;
          grp.isHighlighted = true;
          const shape = grp.findObject("SHAPE");
          if (shape) shape.stroke = "#0078D7";
        },
        mouseDragLeave: (_, grp) => {
          grp.isHighlighted = false;
          const shape = grp.findObject("SHAPE");
          if (shape) shape.stroke = "#4a90e2";
        },
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),

      $(go.Shape, "RoundedRectangle", {
        name: "SHAPE",
        fill: "rgba(230,240,255,0.3)",
        stroke: "#4a90e2",
        strokeWidth: 2,
        parameter1: 10,
      }),
      $(
        go.Panel,
        "Vertical",
        { margin: 10 },
        $(go.TextBlock, {
          margin: new go.Margin(6, 0, 4, 0),
          font: "bold 13px sans-serif",
          editable: true,
        }, new go.Binding("text").makeTwoWay()),
         $(go.TextBlock,
        {
          margin: new go.Margin(0, 0, 6, 0),
          font: "11px sans-serif",
          stroke: "#555",
          editable: true,
          wrap: go.TextBlock.WrapFit,
          width: 120, 
        },
    new go.Binding("text", "description").makeTwoWay()
  ),
  // Count text block
  $(go.TextBlock,
    {
      name:"COUNT_TEXT",
      visible:false,
      font:"12px sans-serif",
      stroke:"#555",
      alignment:go.Spot.Center,
    },
    new go.Binding("visible","isCollapsed"),
    new go.Binding("text","",(d,obj)=>{
      const group = obj.part;
      if(group instanceof go.Group){
        const nodes = group.memberParts.filter(p=>p instanceof go.Node).count;
        const links = group.memberParts.filter(p=> p instanceof go.Link).count;
        return `Nodes:${nodes} | Links: ${links}`;
      }
      return "";
    })
  ),
      $(go.Placeholder,
  { name: "PLACEHOLDER", padding: 10 },
  new go.Binding("visible", "isCollapsed", (v) => !v)
),

    )
  );

    //  Group Adornment (Toolbar)
    diagram.groupTemplate.selectionAdornmentTemplate = $(
      go.Adornment,
      "Spot",
      $(go.Panel, "Auto", $(go.Shape, { fill: null, stroke: "blue", strokeWidth: 1 }), $(go.Placeholder)),
      $(
        go.Panel,
        "Horizontal",
        {
          alignment: new go.Spot(0, 0, -20, -15),
          background: "rgba(255,255,255,0.9)",
          cursor: "pointer",
        },
        $("Button", { 
          toolTip: $("ToolTip", $(go.TextBlock, "Edit Group")),
        "ButtonBorder.stroke": null,
        "_buttonFillOver": "#3399ff",
        "_buttonFillPressed": "#0066cc",
          click: (_, obj) => handleEditNode(obj.part.adornedPart) },
          $(go.TextBlock, "✏️", { margin: 4, font: "14px sans-serif" })
        ),
        $("Button", { 
              toolTip: $("ToolTip", $(go.TextBlock, "Delete Group")),
            "ButtonBorder.stroke": null,
            "_buttonFillOver": "#e35d6a",
            "_buttonFillPressed": "#c82333",
              click: (_, obj) => handleDeleteNode(obj.part.adornedPart) },
          $(go.TextBlock, "🗑", { margin: 4, font: "14px sans-serif" })
        ),
         $("Button",
      {
        toolTip: $("ToolTip", $(go.TextBlock, "Collapse / Expand")),
        "ButtonBorder.stroke": null,
        "_buttonFillOver": "#ffd54f",
        "_buttonFillPressed": "#e0a800",
        click: (_, obj) => {
          const group = obj.part.adornedPart;
          if (group instanceof go.Group) {
            const collapse = !group.data.isCollapsed;
            toggleGroupCollapse(group, collapse);
          }
        },
      },
      $(go.TextBlock,
        {
          margin: 4,
          font: "14px sans-serif",
        },
        new go.Binding("text", "", d => (d.isCollapsed ? "🔼" : "🔽"))
      )
    ),

        $("Button",
          {
            toolTip: $("ToolTip", $(go.TextBlock, "Ungroup All Nodes")),
            "ButtonBorder.fill": "#28a745",
            "ButtonBorder.stroke": null,
            "_buttonFillOver": "#58d68d",
            "_buttonFillPressed": "#218838",
            click:(_,obj)=>{
            const groupPart = obj.part.adornedPart;
            const diagram = groupPart.diagram;
            diagram.startTransaction("ungroup");
            groupPart.memberParts.each(part => {
              diagram.model.setDataProperty(part.data, "group", null);
            });
            diagram.remove(groupPart);
            diagram.commitTransaction("ungroup");
        }},
      $(go.TextBlock, "Ungroup",{margin:4,font:"14px sans-serif"})
    )
      )
    );

    // Node Template
    diagram.nodeTemplate = $(
      go.Node,
      "Spot",
      { locationSpot: go.Spot.Center },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(
        go.Panel,
        "Auto",
        $(go.Shape, "RoundedRectangle",
          { strokeWidth: 1, fill: "#d3e6f5", height: 50 },
          new go.Binding("figure", "shape").makeTwoWay(),
          new go.Binding("fill", "color").makeTwoWay()
        ),
        $(
          go.Panel,
          "Vertical",
          $(go.TextBlock, { margin: 5, editable: true, font: "12px sans-serif" },
            new go.Binding("text").makeTwoWay()
          ),
          $(go.TextBlock, { margin: 2, editable: true, font: "10px sans-serif", stroke: "#333" },
            new go.Binding("text", "description").makeTwoWay()
          )
        )
      ),
      makePort("L", go.Spot.Left, false, true),
      makePort("R", go.Spot.Right, true, false)
    );

    //  Node Edit/Delete Adornment for action nodes
    diagram.nodeTemplate.selectionAdornmentTemplate = $(
      go.Adornment,
      "Spot",
      $(go.Panel, "Auto", $(go.Shape, { fill: null, stroke: "blue", strokeWidth: 1 }), $(go.Placeholder)),
      $(
        go.Panel,
        "Horizontal",
        { alignment: go.Spot.TopLeft, alignmentFocus: go.Spot.BottomLeft, background: "rgba(255,255,255,0.9)" },
        $("Button", { 
            toolTip: $("ToolTip", $(go.TextBlock, "Edit Node")),
            "ButtonBorder.stroke": null,
            "_buttonFillOver": "#3399ff",
            "_buttonFillPressed": "#0066cc",
              click: (_, obj) => handleEditNode(obj.part.adornedPart) },
          $(go.TextBlock, "✏️", { margin: 5, font: "20px sans-serif" })),
        $("Button", { 
            toolTip: $("ToolTip", $(go.TextBlock, "Delete Node")),
            "ButtonBorder.stroke": null,
            "_buttonFillOver": "#e35d6a",
            "_buttonFillPressed": "#c82333",
          click: (_, obj) => handleDeleteNode(obj.part.adornedPart) },
          $(go.TextBlock, "🗑", { margin: 5, font: "20px sans-serif" })),
          $("Button",
            {
              toolTip: $("ToolTip", $(go.TextBlock, "Detach from Group")),
              "ButtonBorder.stroke": null,
              "_buttonFillOver": "#ffd54f",
              "_buttonFillPressed": "#e0a800",
              click:(_,obj)=>{
              const nodePart = obj.part.adornedPart;
              const diagram = nodePart.diagram;
              if(!nodePart.containingGroup) {
                alert("Node is not in any group.");
                return;
              }
            diagram.startTransaction("detachNode");
            diagram.model.setDataProperty(nodePart.data, "group", null);
            diagram.commitTransaction("detachNode");
          },
        },
      $(go.TextBlock, "🔗",{margin:5,font:"20px sans-serif"}))
      )

    );

    // Link Template
    diagram.linkTemplate = $(
      go.Link,
      {
        routing: go.Routing.Normal,
        curve: go.Curve.JumpOver,
        corner: 10,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true,
        resegmentable: true,
        selectable: true,
        toShortLength: 3,
        click: (_, link) => handleLinkClick(link.data),
      },
      new go.Binding("routing", "routing", (r) => go.Routing[r] || go.Routing.Normal),
      new go.Binding("curve", "curve", (c) => go.Curve[c] || go.Curve.None),
      new go.Binding("strokeDashArray", "isDashed", (d) => (d ? [6, 4] : null)),
      new go.Binding("isAnimated", "animated"),
      $(go.Shape, { strokeWidth: 2 }, new go.Binding("stroke", "color")),
      $(go.Shape, { toArrow: "Standard" }, new go.Binding("toArrow", "arrow"), new go.Binding("fill", "color")),
      $(go.TextBlock, { segmentOffset: new go.Point(0, -10), font: "10px sans-serif", stroke: "#333", editable: true },
        new go.Binding("text", "label").makeTwoWay())
    );

    // Model setup
    const model = new go.GraphLinksModel([], []);
    model.nodeKeyProperty = "key";
    model.linkFromKeyProperty = "from";
    model.linkToKeyProperty = "to";
    diagram.model = model;
    
    diagram.addDiagramListener("InitialLayoutCompleted", () => {
      diagram.findTopLevelGroups().each((grp) => {
        if (grp.data.isCollapsed) toggleGroupCollapse(grp, true);
      });
    });


    // Handle drag/drop
    const div = diagram.div;
    const handleDrop = (e) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/my-node");
      if (!data) return;

      const nodeData = JSON.parse(data);
      const rect = div.getBoundingClientRect();
      const point = diagram.transformViewToDoc(new go.Point(e.clientX - rect.left, e.clientY - rect.top));

      const colorMap = { Task: "#fff", Decision: "#fff", Output: "#fff", Default: "#d3e6f5" };
      const shapeMap = { Task: "RoundedRectangle", Decision: "Diamond", Output: "Triangle", Default: "RoundedRectangle" };

      diagram.startTransaction("drop");
      if (nodeData.type === "Group") {
        diagram.model.addNodeData({
          key: Date.now(),
          isGroup: true,
          text: nodeData.text,
          loc: go.Point.stringify(point),
        });
      } else {
        diagram.model.addNodeData({
          key: Date.now(),
          text: nodeData.text,
          type: nodeData.type,
          color: colorMap[nodeData.type] || "#d3e6f5",
          shape: shapeMap[nodeData.type] || "RoundedRectangle",
          loc: go.Point.stringify(point),
          description: "",
        });
      }
      diagram.commitTransaction("drop");
    };

    div.addEventListener("dragover", (e) => e.preventDefault());
    div.addEventListener("drop", handleDrop);

    return () => (diagram.div = null);
  }, [handleEditNode, handleDeleteNode, handleLinkClick, makePort]);

  // to Load saved flow
  useEffect(() => {
    if (!id || !myDiagramRef.current) return;
    const savedFlows = JSON.parse(localStorage.getItem("Flows")) || [];
    const currentFlow = savedFlows.find((flow) => flow.id === id);
    const diagram = myDiagramRef.current;

    if (currentFlow) {
      setSaveFormData({
        flowName: currentFlow.flowName || "",
        flowDescription: currentFlow.flowDescription || "",
      });
      const model = new go.GraphLinksModel(currentFlow.nodes, currentFlow.links);
      model.nodeKeyProperty = "key";
      model.linkFromKeyProperty = "from";
      model.linkToKeyProperty = "to";
      diagram.model = model;
    } else {
      setSaveFormData({ flowName: "", flowDescription: "" });
    }
  }, [id]);

  //  Update Node
  const handleUpdateNode = (e) => {
    e.preventDefault();
    const diagram = myDiagramRef.current;
    diagram.startTransaction("updateNode");
    diagram.model.setDataProperty(editingNode.data, "text", formData.name);
    diagram.model.setDataProperty(editingNode.data, "description", formData.description);
    diagram.commitTransaction("updateNode");
    setEditingNode(null);
  };

  //  Save/Update Flow
  const handleSubmitSaveForm = (e) => {
    e.preventDefault();
    const diagram = myDiagramRef.current;
    const flowId = id || "flow-" + Date.now();
    const existingFlows = JSON.parse(localStorage.getItem("Flows")) || [];
    const existingIndex = existingFlows.findIndex((flow) => flow.id === flowId);

    const dataToSave = {
      id: flowId,
      flowName: saveFormData.flowName,
      flowDescription: saveFormData.flowDescription,
      nodes: diagram.model.nodeDataArray,
      links: diagram.model.linkDataArray,
    };

    if (existingIndex !== -1) existingFlows[existingIndex] = dataToSave;
    else existingFlows.push(dataToSave);

    localStorage.setItem("Flows", JSON.stringify(existingFlows));
    alert(id ? "Flow updated successfully!" : "Flow saved successfully!");
    navigate("/flows");
  };


  return (
    <div className="container">
      <Sidebar onSave={() => setShowSaveForm(true)} id={id} />
      <div ref={diagramRef} className="diagram-area" />

      {/* Node Edit Modal */}
      {editingNode && (
        <div className="modal">
          <h3>Edit Node</h3>
          <form onSubmit={handleUpdateNode}>
            <label>Name:</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <label>Description:</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <button type="submit">Update</button>
            <button type="button" onClick={() => setEditingNode(null)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Save/Update Flow Modal */}
      {showSaveForm && (
        <div className="modal">
          <h3>{id ? "Update Flow" : "Save Flow"}</h3>
          <form onSubmit={handleSubmitSaveForm}>
            <label>Flow Name:</label>
            <input type="text"
              value={saveFormData.flowName}
              onChange={(e) => setSaveFormData({ ...saveFormData, flowName: e.target.value })}
              required />
            <label>Flow Description:</label>
            <textarea
              value={saveFormData.flowDescription}
              onChange={(e) => setSaveFormData({ ...saveFormData, flowDescription: e.target.value })}
              required />
            <button type="submit">{id ? "Update" : "Save"}</button>
            <button type="button" onClick={() => setShowSaveForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Link Edit Modal */}
      {editingLink && (
        <div className="modal link-editor">
          <div className="modal-content">
            <h2>Edit Link Style</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const diagram = myDiagramRef.current;
                diagram.startTransaction("updateLink");
                Object.entries(linkFormData).forEach(([key, val]) =>
                  diagram.model.setDataProperty(editingLink, key, val)
                );
                diagram.commitTransaction("updateLink");
                setEditingLink(null);
              }}
            >
              <div className="form-row">
                <label>Routing:</label>
                <select
                  value={linkFormData.routing}
                  onChange={(e) => setLinkFormData({ ...linkFormData, routing: e.target.value })}
                >
                  <option value="Normal">Normal</option>
                  <option value="Orthogonal">Orthogonal</option>
                  <option value="AvoidsNodes">Avoids Nodes</option>
                </select>
              </div>

              <div className="form-row">
                <label>Curve:</label>
                <select
                  value={linkFormData.curve}
                  onChange={(e) => setLinkFormData({ ...linkFormData, curve: e.target.value })}
                >
                  <option value="None">None</option>
                  <option value="Bezier">Bezier</option>
                  <option value="JumpOver">Jump Over</option>
                </select>
              </div>

              <div className="form-row">
                <label>Arrow Style:</label>
                <select
                  value={linkFormData.arrow}
                  onChange={(e) => setLinkFormData({ ...linkFormData, arrow: e.target.value })}
                >
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
                <input
                  type="color"
                  value={linkFormData.color}
                  onChange={(e) => setLinkFormData({ ...linkFormData, color: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label>Label:</label>
                <input
                  type="text"
                  placeholder="Enter link label"
                  value={linkFormData.label}
                  onChange={(e) => setLinkFormData({ ...linkFormData, label: e.target.value })}
                />
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





remove PlaceHolder in GroupTemplate to avoid flickering