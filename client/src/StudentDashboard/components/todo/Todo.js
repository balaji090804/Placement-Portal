import React, { useState, useEffect } from "react";
import { RiCheckboxCircleFill, RiCheckboxBlankCircleLine } from "react-icons/ri";
import { MdModeEditOutline, MdDeleteOutline } from "react-icons/md";
import "./Todo.css";

const LOCAL_STORAGE_KEY = "react-todo-list-task";

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const storedTodos = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (storedTodos) setTodos(storedTodos);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text) => {
    if (!text.trim()) return;
    setTodos([{ id: Date.now(), text, priority: "Medium", status: "Pending" }, ...todos]);
  };

  const removeTodo = (id) => setTodos(todos.filter((todo) => todo.id !== id));

  const updateTodo = (id, newText) => {
    if (!newText.trim()) return;
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, text: newText } : todo)));
  };

  const completeTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, status: todo.status === "Completed" ? "Pending" : "Completed" } : todo
      )
    );
  };

  const changePriority = (id, newPriority) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, priority: newPriority } : todo)));
  };

  const filteredTodos = todos.filter((todo) => (filter === "All" ? true : todo.status === filter));

  return (
    <section className="todo-page">
      <h1 className="todo-header">✅ Task Manager</h1>

      {/* Task Input */}
      <div className="todo-form">
        <input
          type="text"
          placeholder="Add a new task..."
          onKeyPress={(e) => e.key === "Enter" && addTodo(e.target.value)}
          className="todo-input"
        />
      </div>

      {/* Task Filters */}
      <div className="filter-container">
        <label>Filter Tasks: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Task List */}
      <div className="todo-list">
        {filteredTodos.length === 0 ? (
          <p className="empty-message">🎉 No tasks yet! Add some.</p>
        ) : (
          filteredTodos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.status === "Completed" ? "completed" : ""}`}>
              {/* Checkbox */}
              <div className="icon" onClick={() => completeTodo(todo.id)}>
                {todo.status === "Completed" ? <RiCheckboxCircleFill /> : <RiCheckboxBlankCircleLine />}
              </div>

              {/* Task Text */}
              <p>{todo.text}</p>

              {/* Priority Selector */}
              <select
                className="priority-selector"
                value={todo.priority}
                onChange={(e) => changePriority(todo.id, e.target.value)}
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟠 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>

              {/* Actions */}
              <div className="actions">
                <MdModeEditOutline onClick={() => updateTodo(todo.id, prompt("Edit Task:", todo.text))} />
                <MdDeleteOutline onClick={() => removeTodo(todo.id)} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Todo;
