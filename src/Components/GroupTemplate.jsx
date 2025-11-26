// src/components/diagram/templates/GroupTemplate.jsx
import * as go from "gojs";

export const createGroupTemplate = (diagram, callbacks) => {
  const $ = go.GraphObject.make;
  const { handleEditNode, handleDeleteNode } = callbacks;

  return $(
    go.Group,
    "Auto",
    {
      background: "transparent",
      ungroupable: true,
      computesBoundsAfterDrag: true,
      handlesDragDropForMembers: true,
      resizable: true,
      resizeObjectName: "SHAPE",
      minSize: new go.Size(200, 100),
      

      // PURE expand/collapse state (saved in model)
      isSubGraphExpanded: false,

      subGraphExpandedChanged: (group) => {
        const shape = group.findObject("SHAPE");
        const model = group.diagram.model;
        if (!shape) return;

        // --- COLLAPSE ---
        if (!group.isSubGraphExpanded) {
          // Save expanded size BEFORE collapsing
          const expanded = new go.Size(
            shape.actualBounds.width,
            shape.actualBounds.height
          );

          model.setDataProperty(
            group.data,
            "expandedSize",
            go.Size.stringify(expanded)
          );

          // Set collapsed size
          const collapsed = new go.Size(200, 100);
          shape.desiredSize = collapsed;
          model.setDataProperty(group.data, "size", go.Size.stringify(collapsed));

          group.memberParts.each(p => (p.visible = false));
          return;
        }

        // --- EXPAND ---
        if (group.isSubGraphExpanded) {
          let restored;

          if (group.data.expandedSize) {
            restored = go.Size.parse(group.data.expandedSize);
          } else {
            // First-time expand
            restored = new go.Size(
              shape.actualBounds.width,
              shape.actualBounds.height
            );
            model.setDataProperty(
              group.data,
              "expandedSize",
              go.Size.stringify(restored)
            );
          }

          shape.desiredSize = restored;
          model.setDataProperty(group.data, "size", go.Size.stringify(restored));

          group.memberParts.each(p => (p.visible = true));
        }
      },

      mouseDrop: (e, grp) => {
        if (!grp.isSubGraphExpanded) return;
        const model = grp.diagram.model;

        grp.diagram.startTransaction("addToGroup");
        grp.diagram.selection.each(part => {
          if (part instanceof go.Node && !part.data.isGroup) {
            model.setDataProperty(part.data, "group", grp.data.key);
          }
        });
        grp.diagram.commitTransaction("addToGroup");
      },

      mouseDragEnter: (_, grp) => {
        if (!grp.isSubGraphExpanded) return;
        grp.isHighlighted = true;
      },
      mouseDragLeave: (_, grp) => (grp.isHighlighted = false)
    },

    // Bind location
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),

    // PURE one-field expand binding (important)
    new go.Binding("isSubGraphExpanded").makeTwoWay(),

    // SHAPE
    $(
      go.Shape,
      "RoundedRectangle",
      {
        name: "SHAPE",
        fill: "rgba(230,240,255,0.3)",
        stroke: "#4a90e2",
        strokeWidth: 2,
        parameter1: 10
      },
      new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
    ),

    // CONTENT
    $(
      go.Panel,
      "Vertical",
      { alignment: go.Spot.Top, margin: 10 },

      $(go.TextBlock,
        { font: "bold 13px sans-serif", editable: true, margin: new go.Margin(6, 0, 4, 0) },
        new go.Binding("text").makeTwoWay()
      ),

      $(go.TextBlock,
        { font: "11px sans-serif", stroke: "#555", editable: true, wrap: go.TextBlock.WrapFit, width: 120 },
        new go.Binding("text", "description").makeTwoWay()
      ),

      // count when collapsed
      $(
        go.TextBlock,
        {
          name: "COUNT_TEXT",
          visible: false,
          font: "12px sans-serif",
          stroke: "#333"
        },
        new go.Binding("visible", "isSubGraphExpanded", e => !e),
        new go.Binding("text", "", (_, obj) => {
          const group = obj.part;
          const nodes = group.memberParts.filter(p => p instanceof go.Node).count;
          return `Nodes: ${nodes}`;
        })
      )
    ),

    // ADORNMENTS (buttons)
    {
      selectionAdornmentTemplate: $(
        go.Adornment,
        "Spot",
        $(go.Panel, "Auto",
          $(go.Shape, { fill: null, stroke: "blue", strokeWidth: 1 }),
          $(go.Placeholder)
        ),

        $(
          go.Panel,
          "Horizontal",
          { alignment: new go.Spot(0, 0, -20, -15), background: "rgba(255,255,255,0.9)" },

          // EDIT
          $("Button",
            { toolTip: $("ToolTip", $(go.TextBlock, "Edit Group")) },
            { click: (_, obj) => handleEditNode(obj.part.adornedPart) },
            $(go.TextBlock, "✏️", { margin: 4 })
          ),

          // DELETE
          $("Button",
            { toolTip: $("ToolTip", $(go.TextBlock, "Delete Group")) },
            { click: (_, obj) => handleDeleteNode(obj.part.adornedPart) },
            $(go.TextBlock, "🗑", { margin: 4 })
          ),

          // COLLAPSE / EXPAND
          $("Button",
            {
              toolTip: $("ToolTip",
                $(go.TextBlock,
                  new go.Binding("text", "isSubGraphExpanded",
                    exp => exp ? "Click to Collapse" : "Click to Expand"
                  )
                )
              ),
              click: (_, obj) => {
                const g = obj.part.adornedPart;
                const model = g.diagram.model;

                model.startTransaction("toggle");
                model.setDataProperty(g.data, "isSubGraphExpanded", !g.data.isSubGraphExpanded);
                model.commitTransaction("toggle");

                console.log("STATE UPDATED:", g.data.isSubGraphExpanded);
              }
            },
            $(go.TextBlock,
              new go.Binding("text", "isSubGraphExpanded",
                exp => (exp ? "Collapse" : "Expand"))
            )
          ),

          // UNGROUP
          $("Button",
            { toolTip: $("ToolTip", $(go.TextBlock, "Ungroup")) },
            {
              click: (_, obj) => {
                const g = obj.part.adornedPart;
                const diagram = g.diagram;

                diagram.startTransaction("ungroup");
                g.memberParts.each(p => diagram.model.setDataProperty(p.data, "group", null));
                diagram.remove(g);
                diagram.commitTransaction("ungroup");
              }
            },
            $(go.TextBlock, "Ungroup", { margin: 4 })
          )
        )
      )
    }
  );
};
