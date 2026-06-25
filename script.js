// State
let tasks = [];
let currentFilter = 'all';

// DOM Elements
const taskList = document.getElementById('task-list');
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const emptyState = document.getElementById('empty-state');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const progressBar = document.getElementById('progress-bar');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load from LocalStorage
    const stored = localStorage.getItem('taskflow_tasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            tasks = [];
        }
    }
    
    // Render
    render();
    
    // Event Listeners
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    addBtn.addEventListener('click', addTask);
    
    clearBtn.addEventListener('click', clearCompleted);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            render();
        });
    });
});

// Toast Helper
let toastTimeout;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Save to LocalStorage
function saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// Add Task
function addTask() {
    const text = todoInput.value.trim();
    if (text === '') return;
    
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false
    };
    
    tasks.push(newTask);
    saveTasks();
    todoInput.value = '';
    render();
    showToast('Task added successfully!');
}

// Toggle Task Complete
function toggleComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const nextCompleted = !task.completed;
            showToast(nextCompleted ? 'Task marked as completed' : 'Task marked active');
            return { ...task, completed: nextCompleted };
        }
        return task;
    });
    saveTasks();
    render();
}

// Delete Task
function deleteTask(id, taskElement) {
    taskElement.classList.add('slide-out');
    // Wait for slide-out animation to finish
    taskElement.addEventListener('animationend', () => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        render();
        showToast('Task deleted');
    }, { once: true });
}

// Edit Task Inline
function editTask(id, textSpan, itemElement) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Create edit input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;

    // Replace text with input
    const parent = textSpan.parentNode;
    parent.replaceChild(input, textSpan);
    input.focus();

    // Disable check box click while editing
    const checkbox = itemElement.querySelector('.custom-checkbox');
    const oldPointerEvents = checkbox.style.pointerEvents;
    checkbox.style.pointerEvents = 'none';

    function finishEdit() {
        const newText = input.value.trim();
        checkbox.style.pointerEvents = oldPointerEvents;
        
        if (newText !== '' && newText !== task.text) {
            task.text = newText;
            saveTasks();
            showToast('Task updated');
        }
        render();
    }

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            finishEdit();
        }
    });

    input.addEventListener('blur', finishEdit);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Cancel edit
            input.removeEventListener('blur', finishEdit);
            render();
        }
    });
}

// Clear Completed Tasks
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        showToast('No completed tasks to clear');
        return;
    }
    
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    render();
    showToast(`Cleared ${completedCount} completed tasks`);
}

// Update Stats Card
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    progressText.textContent = `${completed} of ${total} task${total !== 1 ? 's' : ''} completed`;
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    progressPercent.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
}

// Render UI List
function render() {
    taskList.innerHTML = '';
    
    // Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    // Show/Hide Empty State
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'flex';
        taskList.style.display = 'none';
        
        // Update empty state text based on filter
        const emptyTitle = emptyState.querySelector('h3');
        const emptyDesc = emptyState.querySelector('p');
        if (currentFilter === 'active') {
            emptyTitle.textContent = 'No active tasks';
            emptyDesc.textContent = 'Get ahead by adding a new one.';
        } else if (currentFilter === 'completed') {
            emptyTitle.textContent = 'No completed tasks';
            emptyDesc.textContent = 'Items you finish will appear here.';
        } else {
            emptyTitle.textContent = 'Your workspace is clear';
            emptyDesc.textContent = 'Add a task to kickstart your day.';
        }
    } else {
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', task.id);
            
            // Left content wrapper (checkbox + text)
            const leftWrapper = document.createElement('div');
            leftWrapper.className = 'task-item-left';
            
            // Custom checkbox
            const checkbox = document.createElement('div');
            checkbox.className = 'custom-checkbox';
            checkbox.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            checkbox.addEventListener('click', () => toggleComplete(task.id));
            
            // Task text span
            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.text;
            
            leftWrapper.appendChild(checkbox);
            leftWrapper.appendChild(textSpan);
            
            // Right content wrapper (action buttons)
            const actionsWrapper = document.createElement('div');
            actionsWrapper.className = 'task-actions';
            
            // Edit button (only if not completed)
            if (!task.completed) {
                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn edit-btn';
                editBtn.setAttribute('aria-label', 'Edit task');
                editBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                `;
                editBtn.addEventListener('click', () => editTask(task.id, textSpan, li));
                actionsWrapper.appendChild(editBtn);
            }
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.setAttribute('aria-label', 'Delete task');
            deleteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            `;
            deleteBtn.addEventListener('click', () => deleteTask(task.id, li));
            
            actionsWrapper.appendChild(deleteBtn);
            
            // Assemble items
            li.appendChild(leftWrapper);
            li.appendChild(actionsWrapper);
            
            taskList.appendChild(li);
        });
    }
    
    updateStats();
}
