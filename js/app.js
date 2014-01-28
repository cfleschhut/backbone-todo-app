var app = {};

// Model
app.Todo = Backbone.Model.extend({
  defaults: {
    title: '',
    completed: false
  },
  toggle: function() {
    this.save({completed: !this.get("completed")});
  }
});

// Collection
app.TodoList = Backbone.Collection.extend({
  model: app.Todo,
  localStorage: new Store("backbone-todo"),
  completed: function() {
    return this.filter(function(todo) {
      return todo.get('completed');
    });
  },
  remaining: function() {
    return this.without.apply(this, this.completed());
  }
});

app.todoList = new app.TodoList();

// Views
app.TodoView = Backbone.View.extend({
  tagName: "li",
  template: _.template($("#item-template").html()),
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    this.input = this.$(".edit");
    return this;
  },
  initialize: function() {
    this.model.on("change", this.render, this);
    this.model.on("destroy", this.remove, this);
  },
  events: {
    "dblclick label": "edit",
    "keypress .edit": "updateOnEnter",
    "blur .edit": "close",
    "click .toggle": "toggleCompleted",
    "click .destroy": "destroy"
  },
  edit: function() {
    this.$el.addClass("editing");
    this.input.focus();
  },
  updateOnEnter: function(e) {
    if (e.which == 13) {
      this.close();
    }
  },
  close: function() {
    var value = this.input.val().trim();
    if (value) {
      this.model.save({title: value});
    }
    this.$el.removeClass("editing");
  },
  toggleCompleted: function() {
    this.model.toggle();
  },
  destroy: function() {
    this.model.destroy();
  }
});

app.AppView = Backbone.View.extend({
  el: "#todo-app",
  initialize: function() {
    this.input = this.$("#new-todo");
    app.todoList.on("add", this.addOne, this);
    app.todoList.on("reset", this.addAll, this);
    app.todoList.fetch();
  },
  events: {
    "keypress #new-todo": "createTodoOnEnter"
  },
  createTodoOnEnter: function(e) {
    if (e.which != 13 || !this.input.val().trim()) {
      return;
    }
    app.todoList.create(this.newAttributes());
    this.input.val("");
  },
  addOne: function(todo) {
    var view = new app.TodoView({model: todo});
    $("#todo-list").append(view.render().el);
  },
  addAll: function() {
    this.$("#todo-list").html('');
    switch(window.filter) {
      case 'pending':
        _.each(app.todoList.remaining(), this.addOne);
        break;
      case 'completed':
        _.each(app.todoList.completed(), this.addOne);
        break;
      default:
        app.todoList.each(this.addOne, this);
        break;
    }
  },
  newAttributes: function() {
    return {
      title: this.input.val().trim(),
      completed: false
    }
  }
});

// Routes
app.Router = Backbone.Router.extend({
  routes: {
    '': 'index',
    '*filter': 'setFilter'
  },
  index: function() {
  },
  setFilter: function(params) {
    window.filter = params.trim() || '';
    app.todoList.trigger('reset');
  }
});

app.router = new app.Router();
Backbone.history.start();

app.appView = new app.AppView();
