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
