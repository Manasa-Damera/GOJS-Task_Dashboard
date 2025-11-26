// src/components/diagram/templates/LinkTemplate.jsx
import * as go from "gojs";

export const createLinkTemplate = (handleLinkClick) => {
  const $ = go.GraphObject.make;

  return $(
    go.Link,
    {
      routing: go.Routing.Normal,
      curve: go.Curve.JumpOver,
      corner: 10,
      relinkableFrom: true,
      relinkableTo: true,
      reshapable: true,
      resegmentable: true,
      toShortLength: 3,
      click: (_, link) => handleLinkClick(link.data)
    },
    new go.Binding("routing", "routing", r => go.Routing[r] || go.Routing.Normal),
    new go.Binding("curve", "curve", c => go.Curve[c] || go.Curve.None),
    $(go.Shape, { strokeWidth: 2 }, new go.Binding("stroke", "color")),
    $(go.Shape, { toArrow: "Standard" }, new go.Binding("toArrow", "arrow"), new go.Binding("fill", "color")),
    $(go.TextBlock, {
      segmentOffset: new go.Point(0, -10),
      font: "10px sans-serif",
      editable: true
    }, new go.Binding("text", "label").makeTwoWay())
  );
};