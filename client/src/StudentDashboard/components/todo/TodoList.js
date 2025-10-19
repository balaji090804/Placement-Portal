import React from "react";
import TodoListItem from "./TodoListItem";
import "./TodoList.css";

const TodoList = ({ todos, completeTodo, removeTodo, updateTodo, changePriority }) => {
  return (
    <div className="todo-list">
      {todos.length === 0 ? (
        <p className="empty-message">🎉 No tasks yet! Add some.</p>
      ) : (
        todos.map((todo) => (
          <TodoListItem
            key={todo.id}
            todo={todo}
            completeTodo={completeTodo}
            removeTodo={removeTodo}
            updateTodo={updateTodo}
            changePriority={changePriority}
          />
        ))
      )}
    </div>
  );
};

export default TodoList;
