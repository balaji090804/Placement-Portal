import React from "react";
import { RiCheckboxCircleFill, RiCheckboxBlankCircleLine } from "react-icons/ri";
import { MdModeEditOutline, MdDeleteOutline } from "react-icons/md";
import "./TodoListItem.css";

const TodoListItem = ({ todo, completeTodo, removeTodo, updateTodo }) => {
  return (
    <div className={`todo-item ${todo.isComplete ? "completed" : ""}`}>
      <div className="icon">
        {todo.isComplete ? (
          <RiCheckboxCircleFill onClick={() => completeTodo(todo.id)} />
        ) : (
          <RiCheckboxBlankCircleLine onClick={() => completeTodo(todo.id)} />
        )}
      </div>
      <p>{todo.text}</p>
      <div className="actions">
        {!todo.isComplete && (
          <MdModeEditOutline onClick={() => updateTodo(todo.id, { text: todo.text })} />
        )}
        <MdDeleteOutline onClick={() => removeTodo(todo.id)} />
      </div>
    </div>
  );
};

export default TodoListItem;
