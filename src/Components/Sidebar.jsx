import "./Sidebar.css";

const nodeTypes = [
  { type: "Input ", text: "Input Node" },
  { type: "Decision", text: "Decision Node" },
  { type: "Output", text: "Output Node" },
  { type: "Default", text: "Default Node" },
  {type: "Group", text: "Group Node" },
];

const Sidebar = ({onSave,id}) => {
  const handleDragStart = (e, nodeData) => {
    // console.log("nodeData", nodeData);
    e.dataTransfer.setData("application/my-node", JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="sidebar">
      <h4>Custom Nodes</h4>
      {nodeTypes.map((node) => (
        <div
          key={node.type}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          className="draggable-node"
        >
          {node.text}
        </div>
      ))}
      <button onClick={onSave} className="save-btn"> {id ? "Update" : "Save"}</button>
    </div>
  );
};

export default Sidebar;
