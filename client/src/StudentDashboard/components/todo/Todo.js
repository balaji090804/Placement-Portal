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
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");

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

  const addTodo = async (text, priority, dueDate) => {
    if (!text.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, priority, dueDate: dueDate || undefined }),
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
    if (!newText || !newText.trim()) return;
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

  const changePriority = async (id, priority) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priority }),
      });
      const json = await res.json();
      setTodos((prev) => prev.map((t) => (t._id === json._id ? json : t)));
    } catch (e) {
      console.error("Failed to update priority", e);
    }
  };

  const updateDueDate = async (id, dueDate) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dueDate }),
      });
      const json = await res.json();
      setTodos((prev) => prev.map((t) => (t._id === json._id ? json : t)));
    } catch (e) {
      console.error("Failed to update due date", e);
    }
  };

  // Grouping helpers for a Classroom-like daily view
  const toDate = (d) => (d ? new Date(d) : null);
  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const isOverdue = (d, status) =>
    d && d < startOfToday && status !== "Completed";
  const isToday = (d) => d && isSameDay(d, startOfToday);
  const isUpcoming = (d, status) =>
    d && d >= startOfToday && !isToday(d) && status !== "Completed";

  const filteredTodos = todos.filter((todo) =>
    filter === "All" ? true : todo.status === filter
  );

  // Build sections only for the All filter
  const byDueDateAsc = (a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return da - db;
  };
  const sections = React.useMemo(() => {
    if (filter !== "All") return null;
    const dueToday = [];
    const overdue = [];
    const upcoming = [];
    const noDue = [];
    for (const t of todos) {
      const d = toDate(t.dueDate);
      if (!d) {
        noDue.push(t);
      } else if (isToday(d)) {
        dueToday.push(t);
      } else if (isOverdue(d, t.status)) {
        overdue.push(t);
      } else if (isUpcoming(d, t.status)) {
        upcoming.push(t);
      } else {
        // completed with past due date
        noDue.push(t);
      }
    }
    return {
      dueToday: dueToday.sort(byDueDateAsc),
      overdue: overdue.sort(byDueDateAsc),
      upcoming: upcoming.sort(byDueDateAsc),
      noDue: noDue.sort(byDueDateAsc),
    };
  }, [todos, filter]);

  const counts = React.useMemo(() => {
    const pending = todos.filter((t) => t.status !== "Completed");
    const completed = todos.filter((t) => t.status === "Completed");
    const todayCount = pending.filter((t) => isToday(toDate(t.dueDate))).length;
    const overdueCount = pending.filter((t) =>
      isOverdue(toDate(t.dueDate), t.status)
    ).length;
    const upcomingCount = pending.filter((t) =>
      isUpcoming(toDate(t.dueDate), t.status)
    ).length;
    return {
      todayCount,
      overdueCount,
      upcomingCount,
      completed: completed.length,
    };
  }, [todos]);

  return (
    <section className="todo-page">
      <h1 className="todo-header">Task Manager</h1>

      {/* Task Input */}
      <div className="todo-form card">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="todo-input"
        />
        <select
          className="priority-selector"
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <input
          type="date"
          className="due-input"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
        />
        <button
          className="btn btn-primary add-btn"
          onClick={async () => {
            await addTodo(newText, newPriority, newDueDate);
            setNewText("");
            setNewPriority("Medium");
            setNewDueDate("");
          }}
          disabled={!newText.trim()}
        >
          Add
        </button>
      </div>

      {/* Quick stats */}
      <div className="todo-analytics">
        <div className="stat">
          <span className="value">{counts.todayCount}</span>
          <span className="label">Due Today</span>
        </div>
        <div className="stat">
          <span className="value">{counts.overdueCount}</span>
          <span className="label">Overdue</span>
        </div>
        <div className="stat">
          <span className="value">{counts.upcomingCount}</span>
          <span className="label">Upcoming</span>
        </div>
        <div className="stat">
          <span className="value">{counts.completed}</span>
          <span className="label">Completed</span>
        </div>
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

      {/* Daily sections for All view, or flat list for filtered views */}
      {filter === "All" ? (
        <>
          {sections && (
            <>
              {/* Due Today */}
              <TaskSection
                title={`Due Today (${sections.dueToday.length})`}
                tasks={sections.dueToday}
                completeTodo={completeTodo}
                updateDueDate={updateDueDate}
                changePriority={changePriority}
                updateTodo={updateTodo}
                removeTodo={removeTodo}
              />
              {/* Overdue */}
              <TaskSection
                title={`Overdue (${sections.overdue.length})`}
                tasks={sections.overdue}
                completeTodo={completeTodo}
                updateDueDate={updateDueDate}
                changePriority={changePriority}
                updateTodo={updateTodo}
                removeTodo={removeTodo}
              />
              {/* Upcoming */}
              <TaskSection
                title={`Upcoming (${sections.upcoming.length})`}
                tasks={sections.upcoming}
                completeTodo={completeTodo}
                updateDueDate={updateDueDate}
                changePriority={changePriority}
                updateTodo={updateTodo}
                removeTodo={removeTodo}
              />
              {/* No Due Date or completed */}
              <TaskSection
                title={`Assigned (${sections.noDue.length})`}
                tasks={sections.noDue}
                completeTodo={completeTodo}
                updateDueDate={updateDueDate}
                changePriority={changePriority}
                updateTodo={updateTodo}
                removeTodo={removeTodo}
              />
            </>
          )}
        </>
      ) : (
        <div className="todo-list">
          {filteredTodos.length === 0 ? (
            <p className="empty-message">No tasks found.</p>
          ) : (
            filteredTodos.map((todo) => (
              <TodoRow
                key={todo._id || todo.id}
                todo={todo}
                completeTodo={completeTodo}
                updateDueDate={updateDueDate}
                changePriority={changePriority}
                updateTodo={updateTodo}
                removeTodo={removeTodo}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default Todo;

// Reusable row component
const TodoRow = ({
  todo,
  completeTodo,
  updateDueDate,
  changePriority,
  updateTodo,
  removeTodo,
}) => {
  const id = todo._id || todo.id;
  const due = todo.dueDate ? new Date(todo.dueDate) : null;
  const overdue =
    due &&
    new Date(due.getFullYear(), due.getMonth(), due.getDate()) <
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ) &&
    todo.status !== "Completed";
  return (
    <div
      className={`todo-item ${todo.status === "Completed" ? "completed" : ""}`}
    >
      <div className="icon" onClick={() => completeTodo(id)}>
        {todo.status === "Completed" ? (
          <RiCheckboxCircleFill />
        ) : (
          <RiCheckboxBlankCircleLine />
        )}
      </div>
      <div className="todo-main">
        <p className="todo-text">{todo.text}</p>
        <div className="todo-meta">
          {todo.assignedBy && (
            <span
              className="faculty-badge"
              aria-label={`Assigned by ${todo.assignedBy}`}
            >
              Assigned by {todo.assignedBy}
            </span>
          )}
          <span className="muted">Due:&nbsp;</span>
          <input
            type="date"
            className={`due-input inline ${overdue ? "overdue" : ""}`}
            value={
              due
                ? new Date(due.getTime() - due.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 10)
                : ""
            }
            onChange={(e) => updateDueDate(id, e.target.value || null)}
          />
        </div>
      </div>
      <select
        className="priority-selector"
        value={todo.priority}
        onChange={(e) => changePriority(id, e.target.value)}
      >
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <div className="actions">
        <MdModeEditOutline
          onClick={() => updateTodo(id, prompt("Edit Task:", todo.text))}
        />
        <MdDeleteOutline onClick={() => removeTodo(id)} />
      </div>
    </div>
  );
};

// Section wrapper
const TaskSection = ({
  title,
  tasks,
  completeTodo,
  updateDueDate,
  changePriority,
  updateTodo,
  removeTodo,
}) => {
  return (
    <div style={{ marginTop: 12 }}>
      <h3 className="section-title" style={{ marginBottom: 8 }}>
        {title}
      </h3>
      <div className="todo-list">
        {tasks.length === 0 ? (
          <p className="empty-message">Nothing here.</p>
        ) : (
          tasks.map((t) => (
            <TodoRow
              key={t._id || t.id}
              todo={t}
              completeTodo={completeTodo}
              updateDueDate={updateDueDate}
              changePriority={changePriority}
              updateTodo={updateTodo}
              removeTodo={removeTodo}
            />
          ))
        )}
      </div>
    </div>
  );
};
