import React, { useEffect, useRef, useState } from "react";
import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
// import "./ActionNode.css";

const ActionNodeDiagram = () => {
  const diagramRef = useRef();
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState({ key: null, label: "", description: "" });

  const initDiagram = () => {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, {
      "undoManager.isEnabled": true,
      "animationManager.isEnabled": false,
      allowDrop: true,
      layout: $(go.GridLayout),
      model: $(go.GraphLinksModel, {
        linkKeyProperty: "key",
        nodeDataArray: [],
        linkDataArray: [],
      }),
    });

    // Define custom node
    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      {
        selectionAdornmentTemplate: $(
          go.Adornment,
          "Spot",
          $(go.Panel, "Auto", $(go.Shape, { fill: null, stroke: "dodgerblue", strokeWidth: 2 })),
          // Toolbar when selected
          $(
            "Button",
            {
              alignment: go.Spot.TopRight,
              click: (e, obj) => handleEdit(obj.part.data),
            },
            $(go.TextBlock, "✏️", { margin: 2, font: "12px sans-serif" })
          ),
          $(
            "Button",
            {
              alignment: go.Spot.TopLeft,
              click: (e, obj) => handleDelete(obj.part.data, diagram),
            },
            $(go.TextBlock, "🗑️", { margin: 2, font: "12px sans-serif" })
          ),
          $(
            "Button",
            {
              alignment: go.Spot.BottomRight,
              click: (e, obj) => handleCopy(obj.part.data, diagram),
            },
            $(go.TextBlock, "📄", { margin: 2, font: "12px sans-serif" })
          )
        ),
      },
      $(go.Shape, "RoundedRectangle", {
        fill: "#e3f2fd",
        stroke: "#64b5f6",
        strokeWidth: 1.5,
      }),
      $(
        go.Panel,
        "Table",
        $(go.TextBlock, { row: 0, margin: 6, editable: false, font: "bold 12px sans-serif" },
          new go.Binding("text", "label")
        ),
        $(go.TextBlock, { row: 1, margin: 4, font: "10px sans-serif", stroke: "#555", maxSize: new go.Size(120, NaN), wrap: go.TextBlock.WrapFit },
          new go.Binding("text", "description")
        )
      )
    );

    // Load from localStorage
    const saved = localStorage.getItem("gojsData");
    if (saved) {
      const { nodeDataArray, linkDataArray } = JSON.parse(saved);
      diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    }

    // Auto-save on model change
    diagram.addModelChangedListener((e) => {
      if (e.isTransactionFinished) saveToLocalStorage(diagram);
    });

    return diagram;
  };

  const handleEdit = (nodeData) => {
    setEditData({ key: nodeData.key, label: nodeData.label, description: nodeData.description });
    setOpen(true);
  };

  const handleSave = (diagram) => {
    diagram.startTransaction("update node");
    const model = diagram.model;
    model.setDataProperty(
      model.findNodeDataForKey(editData.key),
      "label",
      editData.label
    );
    model.setDataProperty(
      model.findNodeDataForKey(editData.key),
      "description",
      editData.description
    );
    diagram.commitTransaction("update node");
    saveToLocalStorage(diagram);
    setOpen(false);
  };

  const handleDelete = (nodeData, diagram) => {
    diagram.startTransaction("delete node");
    diagram.model.removeNodeData(nodeData);
    diagram.commitTransaction("delete node");
    saveToLocalStorage(diagram);
  };

  const handleCopy = (nodeData, diagram) => {
    diagram.startTransaction("copy node");
    const newNode = { ...nodeData, key: Date.now(), label: nodeData.label + " Copy" };
    newNode.loc = go.Point.stringify(go.Point.parse(nodeData.loc).offset(60, 60));
    diagram.model.addNodeData(newNode);
    diagram.commitTransaction("copy node");
    saveToLocalStorage(diagram);
  };

  const saveToLocalStorage = (diagram) => {
    const data = {
      nodeDataArray: diagram.model.nodeDataArray,
      linkDataArray: diagram.model.linkDataArray,
    };
    localStorage.setItem("gojsData", JSON.stringify(data));
  };

  return (
    <div>
      <ReactDiagram
        ref={diagramRef}
        initDiagram={initDiagram}
        divClassName="diagram-area"
        style={{ width: "100%", height: "80vh", border: "1px solid #ccc" }}
      />

      {open && (
        <div className="edit-popup">
          <div className="edit-content">
            <h3>Edit Node</h3>
            <label>Name:</label>
            <input
              type="text"
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
            />
            <label>Description:</label>
            <input
              type="text"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
            <div className="actions">
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button
                onClick={() => handleSave(diagramRef.current.getDiagram())}
                style={{ background: "#007bff", color: "#fff" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionNodeDiagram;
