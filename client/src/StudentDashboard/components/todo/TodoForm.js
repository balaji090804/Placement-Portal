import React, { useState, useEffect, useRef } from "react";
import { MdOutlineEditNote } from "react-icons/md";
import "./TodoForm.css";

const TodoForm = ({ onSubmit, edit }) => {
  const [input, setInput] = useState(edit ? edit.value : "");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit({
      id: edit ? edit.id : new Date().getTime(),
      text: input,
    });
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <div className="input-container">
        <MdOutlineEditNote size={28} />
        <input
          type="text"
          placeholder={edit ? "Update task..." : "Add a new task..."}
          value={input}
          onChange={handleChange}
          ref={inputRef}
          className="todo-input"
        />
      </div>
    </form>
  );
};

export default TodoForm;
