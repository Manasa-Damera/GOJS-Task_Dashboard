// src/components/diagram/templates/NodeTemplate.jsx
import * as go from "gojs";

export const createNodeTemplate = (makePort, handleEditNode, handleDeleteNode) => {
  const $ = go.GraphObject.make;

  return $(
    go.Node, "Spot",
    {
      locationSpot: go.Spot.Center,
      dragComputation: (part, pt) => {
        const group = part.containingGroup;
        if (!group) return pt;
        const gb = group.actualBounds;
        const nb = part.actualBounds;
        const margin = 15;
        let x = pt.x, y = pt.y;
        if (x < gb.x + margin) x = gb.x + margin;
        if (x + nb.width > gb.right - margin) x = gb.right - nb.width - margin;
        if (y < gb.y + margin) y = gb.y + margin;
        if (y + nb.height > gb.bottom - margin) y = gb.bottom - nb.height - margin;
        return new go.Point(x, y);
      }
    },
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),

    $(go.Panel, "Auto",
      $(go.Shape, "RoundedRectangle", {
        strokeWidth: 1,
        fill: "#d3e6f5",
        height: 50
      }, new go.Binding("figure", "shape"), new go.Binding("fill", "color")),
      $(go.Panel, "Vertical",
        $(go.TextBlock, {
          margin: 8,
          editable: true,
          font: "12px sans-serif"
        }, new go.Binding("text").makeTwoWay()),
        $(go.TextBlock, {
          margin: 4,
          editable: true,
          font: "10px sans-serif",
          stroke: "#555"
        }, new go.Binding("text", "description").makeTwoWay())
      )
    ),

    makePort("L", go.Spot.Left, false, true),
    makePort("R", go.Spot.Right, true, false),

    // Selection Adornment
    {
      selectionAdornmentTemplate: $(
       go.Adornment,
      "Spot",
      $(go.Panel, "Auto", $(go.Shape, { fill: null, stroke: "blue", strokeWidth: 1 }), $(go.Placeholder)),
      $(go.Panel, "Horizontal", { alignment: go.Spot.TopLeft, alignmentFocus: go.Spot.BottomLeft, background: "rgba(255,255,255,0.9)" },
        $("Button", { toolTip: $("ToolTip", $(go.TextBlock, "Edit Node")), "ButtonBorder.stroke": null, "_buttonFillOver": "#3399ff", "_buttonFillPressed": "#0066cc",
          click: (_, obj) => handleEditNode(obj.part.adornedPart) }, 
          $(go.TextBlock, "✏️", { margin: 5, font: "20px sans-serif" })),
        $("Button", { toolTip: $("ToolTip", $(go.TextBlock, "Delete Node")), "ButtonBorder.stroke": null, "_buttonFillOver": "#e35d6a", "_buttonFillPressed": "#c82333", 
          click: (_, obj) => handleDeleteNode(obj.part.adornedPart) }, 
          $(go.TextBlock, "🗑", { margin: 5, font: "20px sans-serif" })),
        $("Button", { toolTip: $("ToolTip", $(go.TextBlock, "Detach from Group")), "ButtonBorder.stroke": null, "_buttonFillOver": "#ffd54f", "_buttonFillPressed": "#e0a800", 
          click: (_, obj) => { const nodePart = obj.part.adornedPart; 
            const diagram = nodePart.diagram; 
            if (!nodePart.containingGroup) { alert("Node is not in any group."); return; } 
            diagram.startTransaction("detachNode"); 
            diagram.model.setDataProperty(nodePart.data, "group", null); 
            diagram.commitTransaction("detachNode"); } }, 
            $(go.TextBlock, "🔗", { margin: 5, font: "20px sans-serif" }))
      ))
    }
  );
};


































// Node Template
    // diagram.nodeTemplate = $(
    //   go.Node,
    //   "Spot",
    //   { locationSpot: go.Spot.Center },
    //   new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    //   $(
    //     go.Panel,
    //     "Auto",
    //     $(go.Shape, "RoundedRectangle",
    //       { strokeWidth: 1, fill: "#d3e6f5", height: 50 },
    //       new go.Binding("figure", "shape").makeTwoWay(),
    //       new go.Binding("fill", "color").makeTwoWay()
    //     ),
    //     $(
    //       go.Panel,
    //       "Vertical",
    //       $(go.TextBlock, { margin: 5, editable: true, font: "12px sans-serif" },
    //         new go.Binding("text").makeTwoWay()
    //       ),
    //       $(go.TextBlock, { margin: 2, editable: true, font: "10px sans-serif", stroke: "#333" },
    //         new go.Binding("text", "description").makeTwoWay()
    //       )
    //     )
    //   ),
    //   makePort("L", go.Spot.Left, false, true),
    //   makePort("R", go.Spot.Right, true, false)
    // );

    // //  Node Edit/Delete Adornment for action nodes
    // diagram.nodeTemplate.selectionAdornmentTemplate = $(
    //   go.Adornment,
    //   "Spot",
    //   $(go.Panel, "Auto", $(go.Shape, { fill: null, stroke: "blue", strokeWidth: 1 }), $(go.Placeholder)),
    //   $(
    //     go.Panel,
    //     "Horizontal",
    //     { alignment: go.Spot.TopLeft, alignmentFocus: go.Spot.BottomLeft, background: "rgba(255,255,255,0.9)" },
    //     $("Button", { 
    //         toolTip: $("ToolTip", $(go.TextBlock, "Edit Node")),
    //         "ButtonBorder.stroke": null,
    //         "_buttonFillOver": "#3399ff",
    //         "_buttonFillPressed": "#0066cc",
    //           click: (_, obj) => handleEditNode(obj.part.adornedPart) },
    //       $(go.TextBlock, "✏️", { margin: 5, font: "20px sans-serif" })),
    //     $("Button", { 
    //         toolTip: $("ToolTip", $(go.TextBlock, "Delete Node")),
    //         "ButtonBorder.stroke": null,
    //         "_buttonFillOver": "#e35d6a",
    //         "_buttonFillPressed": "#c82333",
    //       click: (_, obj) => handleDeleteNode(obj.part.adornedPart) },
    //       $(go.TextBlock, "🗑", { margin: 5, font: "20px sans-serif" })),
    //       $("Button",
    //         {
    //           toolTip: $("ToolTip", $(go.TextBlock, "Detach from Group")),
    //           "ButtonBorder.stroke": null,
    //           "_buttonFillOver": "#ffd54f",
    //           "_buttonFillPressed": "#e0a800",
    //           click:(_,obj)=>{
    //           const nodePart = obj.part.adornedPart;
    //           const diagram = nodePart.diagram;
    //           if(!nodePart.containingGroup) {
    //             alert("Node is not in any group.");
    //             return;
    //           }
    //         diagram.startTransaction("detachNode");
    //         diagram.model.setDataProperty(nodePart.data, "group", null);
    //         diagram.commitTransaction("detachNode");
    //       },
    //     },
    //   $(go.TextBlock, "🔗",{margin:5,font:"20px sans-serif"}))
    //   )

    // );
