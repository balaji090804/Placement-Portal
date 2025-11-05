import React, { useState, useEffect } from "react";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import { MdModeEditOutline, MdDeleteOutline } from "react-icons/md";
import "./Todo.css";
import { onEvent } from "../../../lib/socket";
// Tasks now persist on the server; we call REST APIs instead of localStorage

const API_BASE = "http://localhost:8080/api/tasks";

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_BASE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (Array.isArray(json)) setTodos(json);
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    };
    const offCreated = onEvent("task:created", (task) => {
      setTodos((prev) => [task, ...prev.filter((t) => t._id !== task._id)]);
    });
    const offUpdated = onEvent("task:updated", (task) => {
      setTodos((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    });
    const offToggled = onEvent("task:toggled", (task) => {
      setTodos((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    });
    const offDeleted = onEvent("task:deleted", ({ _id }) => {
      setTodos((prev) => prev.filter((t) => t._id !== _id));
    });
    load();
    return () => {
      [offCreated, offUpdated, offToggled, offDeleted].forEach((off) => {
        if (typeof off === "function") off();
      });
    };
  }, []);

  const addTodo = async (text) => {
    if (!text.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json && json._id) setTodos((prev) => [json, ...prev]);
    } catch (e) {
      console.error("Failed to add task", e);
    }
  };

  const removeTodo = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(todos.filter((todo) => (todo._id || todo.id) !== id));
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  const updateTodo = async (id, newText) => {
    if (!newText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newText }),
      });
      const json = await res.json();
      setTodos(
        todos.map((todo) =>
          (todo._id || todo.id) === id ? { ...todo, ...json } : todo
        )
      );
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  const completeTodo = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setTodos(
        todos.map((todo) =>
          (todo._id || todo.id) === id ? { ...todo, ...json } : todo
        )
      );
    } catch (e) {
      console.error("Failed to toggle task", e);
    }
  };

  const changePriority = (id, newPriority) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, priority: newPriority } : todo
      )
    );
  };

  const filteredTodos = todos.filter((todo) =>
    filter === "All" ? true : todo.status === filter
  );

  return (
    <section className="todo-page">
      <h1 className="todo-header">✅ Task Manager</h1>

      {/* Task Input */}
      <div className="todo-form">
        <input
          type="text"
          placeholder="Add a new task..."
          onKeyPress={async (e) => {
            if (e.key === "Enter") {
              await addTodo(e.target.value);
              e.target.value = "";
            }
          }}
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
          filteredTodos.map((todo) => {
            const id = todo._id || todo.id;
            return (
              <div
                key={id}
                className={`todo-item ${
                  todo.status === "Completed" ? "completed" : ""
                }`}
              >
                {/* Checkbox */}
                <div className="icon" onClick={() => completeTodo(id)}>
                  {todo.status === "Completed" ? (
                    <RiCheckboxCircleFill />
                  ) : (
                    <RiCheckboxBlankCircleLine />
                  )}
                </div>

                {/* Task Text */}
                <p>{todo.text}</p>

                {/* Priority Selector */}
                <select
                  className="priority-selector"
                  value={todo.priority}
                  onChange={(e) => changePriority(id, e.target.value)}
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟠 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>

                {/* Actions */}
                <div className="actions">
                  <MdModeEditOutline
                    onClick={() =>
                      updateTodo(id, prompt("Edit Task:", todo.text))
                    }
                  />
                  <MdDeleteOutline onClick={() => removeTodo(id)} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default Todo;
