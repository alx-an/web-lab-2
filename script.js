"use strict";

function element(tag, text = "", className = "") {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  return node;
}

function input(type, name) {
  const field = element("input");
  field.type = type;
  field.name = name;
  if (type === "date") field.max = "9999-12-31";
  return field;
}

function labeled(text, field) {
  const label = element("label", text);
  label.append(field);
  return label;
}

function select(options) {
  const field = element("select");
  for (const [value, label] of options) {
    const option = element("option", label);
    option.value = value;
    field.append(option);
  }
  return field;
}

function button(text, type = "button") {
  const control = element("button", text);
  control.type = type;
  return control;
}

document.documentElement.lang = "ru";
document.title = "Список задач";
const charset = element("meta");
charset.setAttribute("charset", "utf-8");
const viewport = element("meta");
viewport.name = "viewport";
viewport.content = "width=device-width, initial-scale=1";
const stylesheet = element("link");
stylesheet.rel = "stylesheet";
stylesheet.href = "style.css";
document.head.prepend(charset);
document.head.append(viewport, stylesheet);

const page = element("main", "", "page");
const heading = element("header");
heading.append(element("h1", "Список задач"));

const taskForm = element("form", "", "fields task-form");
const titleField = input("text", "title");
titleField.required = true;
titleField.placeholder = "Например, сдать лабораторную";
const dateField = input("date", "date");
dateField.required = true;
const add = button("Добавить", "submit");
add.className = "primary";
taskForm.append(labeled("Название задачи", titleField), labeled("Дата", dateField), add);

const tasksSection = element("section");
const controls = element("div", "", "fields controls");
const search = input("search", "search");
search.placeholder = "Введите название";
const dateFilter = input("date", "date-filter");
const statusFilter = select([
  ["all", "Все"],
  ["active", "Активные"],
  ["done", "Выполненные"]
]);
const order = select([
  ["manual", "Ручной порядок"],
  ["asc", "Сначала ближайшие"],
  ["desc", "Сначала поздние"]
]);
controls.append(labeled("Поиск", search), labeled("Фильтр по дате", dateFilter),
  labeled("Статус", statusFilter), labeled("Сортировка", order));

const hint = element("p", "", "hint");
const notice = element("p", "", "hint");
notice.setAttribute("role", "status");
const empty = element("p", "Задач пока нет.", "empty");
empty.setAttribute("role", "status");
const list = element("ul", "", "task-list");
tasksSection.append(element("h2", "Задачи"), controls, hint, notice, empty, list);
page.append(heading, taskForm, tasksSection);
document.body.append(page);

const storageKey = "web-lab-2.tasks";
let tasks = loadTasks();
let editingId = null;
let draggedId = null;

function canDrag() {
  return order.value === "manual" && !search.value.trim() && !dateFilter.value &&
    statusFilter.value === "all" && editingId === null && tasks.length > 1;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = tasks.filter(task =>
    task.title.toLowerCase().includes(query) &&
    (!dateFilter.value || task.date === dateFilter.value) &&
    (statusFilter.value === "all" || task.done === (statusFilter.value === "done"))
  );

  if (order.value !== "manual") {
    const direction = order.value === "asc" ? 1 : -1;
    visible.sort((first, second) => direction * first.date.localeCompare(second.date));
  }

  draggedId = null;
  hint.textContent = canDrag()
    ? "Чтобы изменить порядок, перетащите задачу за значок ⋮⋮."
    : "Перетаскивание доступно в ручном порядке без поиска, фильтров и редактирования.";
  hint.hidden = tasks.length < 2;
  list.replaceChildren(...visible.map(taskRow));
  empty.textContent = tasks.length ? "Нет задач по этим условиям." : "Задач пока нет.";
  empty.hidden = visible.length > 0;
}

function taskRow(task) {
  const row = element("li", "", task.done ? "task done" : "task");
  if (editingId === task.id) {
    row.append(editForm(task));
    return row;
  }

  const checkbox = input("checkbox", "done");
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", "Выполнено: " + task.title);
  checkbox.addEventListener("change", () => {
    task.done = checkbox.checked;
    updateTasks();
    list.querySelector('[data-id="' + task.id + '"] input')?.focus();
  });

  const name = element("span", task.title, "task-title");
  const date = element("time", task.date.split("-").reverse().join("."), "task-date");
  date.dateTime = task.date;
  const details = element("div", "", "task-details");
  details.append(name, date);

  const edit = button("Изменить");
  edit.addEventListener("click", () => {
    editingId = task.id;
    render();
    list.querySelector(".edit-form input").focus();
  });
  const remove = button("Удалить");
  remove.addEventListener("click", () => {
    tasks = tasks.filter(item => item.id !== task.id);
    updateTasks();
    titleField.focus();
  });
  const actions = element("div", "", "actions");
  actions.append(edit, remove);
  row.dataset.id = task.id;
  const handle = element("span", "⋮⋮", "drag-handle");
  handle.setAttribute("aria-hidden", "true");
  handle.draggable = canDrag();
  if (handle.draggable) setupDrag(row, handle, task.id);
  row.append(handle, checkbox, details, actions);
  return row;
}

function setupDrag(row, handle, id) {
  handle.addEventListener("dragstart", event => {
    draggedId = id;
    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setDragImage(row, 16, 16);
    row.classList.add("dragging");
  });

  handle.addEventListener("dragend", () => {
    draggedId = null;
    row.classList.remove("dragging");
  });

  function afterMiddle(event) {
    const bounds = row.getBoundingClientRect();
    return event.clientY > bounds.top + bounds.height / 2;
  }

  row.addEventListener("dragover", event => {
    if (draggedId === null || draggedId === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    row.classList.toggle("drop-before", !afterMiddle(event));
    row.classList.toggle("drop-after", afterMiddle(event));
  });

  row.addEventListener("dragleave", event => {
    if (!row.contains(event.relatedTarget)) row.classList.remove("drop-before", "drop-after");
  });

  row.addEventListener("drop", event => {
    if (draggedId === null || draggedId === id) return;
    event.preventDefault();
    const from = tasks.findIndex(task => task.id === draggedId);
    if (from === -1) return;
    const [moved] = tasks.splice(from, 1);
    const target = tasks.findIndex(task => task.id === id);
    tasks.splice(target + Number(afterMiddle(event)), 0, moved);
    updateTasks();
  });
}

function editForm(task) {
  const form = element("form", "", "fields edit-form");
  const name = input("text", "title");
  name.required = true;
  name.value = task.title;
  const date = input("date", "date");
  date.required = true;
  date.value = task.date;
  const save = button("Сохранить", "submit");
  save.className = "primary";
  const cancel = button("Отмена");
  const actions = element("div", "", "actions");
  actions.append(save, cancel);
  form.append(labeled("Название задачи", name), labeled("Дата", date), actions);

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validTitle(name)) return;
    task.title = name.value.trim();
    task.date = date.value;
    editingId = null;
    updateTasks();
    focusEdit(task.id);
  });

  cancel.addEventListener("click", () => {
    editingId = null;
    render();
    focusEdit(task.id);
  });
  return form;
}

function focusEdit(id) {
  const edit = list.querySelector('[data-id="' + id + '"] button');
  (edit || titleField).focus();
}

function validTitle(field) {
  if (field.value.trim()) return true;
  field.value = "";
  field.reportValidity();
  return false;
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) throw new Error();

    const ids = new Set();
    const date = input("date", "check");
    const valid = saved.filter(task => {
      if (!task || !Number.isSafeInteger(task.id) || task.id < 1 || ids.has(task.id) ||
          typeof task.title !== "string" || !task.title.trim() ||
          typeof task.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(task.date) ||
          typeof task.done !== "boolean") return false;
      date.value = task.date;
      if (!date.value) return false;
      ids.add(task.id);
      return true;
    });
    if (valid.length !== saved.length) notice.textContent = "Некоторые задачи не удалось восстановить.";
    return valid;
  } catch {
    notice.textContent = "Не удалось загрузить сохранённые задачи.";
    return [];
  }
}

function updateTasks() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    notice.textContent = "";
  } catch {
    notice.textContent = "Не удалось сохранить задачи в браузере.";
  }
  render();
}

let nextId = 1;
taskForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!validTitle(titleField)) return;
  while (tasks.some(task => task.id === nextId)) nextId++;
  tasks.push({
    id: nextId++,
    title: titleField.value.trim(),
    date: dateField.value,
    done: false
  });
  taskForm.reset();
  updateTasks();
  titleField.focus();
});

render();

for (const control of [search, dateFilter, statusFilter, order]) {
  control.addEventListener("input", () => {
    editingId = null;
    render();
  });
}
