(function ($) {
  $.fn.extend({
    toObject: function () {
      //   var result = {};
      //   $.each(this.serializeArray(), function (i, v) {
      //     result[v.name] = v.value;
      //   });
      //   return result;
      return this.serializeArray().reduce((result, { name, value }) => {
        result[name] = value;
        return result;
      }, {});
    },
    fromObject: function (obj) {
      $.each(this.find(":input"), function (i, v) {
        var name = $(v).attr("name");
        if (obj[name]) {
          $(v).val(obj[name]);
        } else {
          $(v).val("");
        }
      });
    },
  });
})(jQuery);

tasksController = (function () {
  var taskPage;
  var initialised = false;
  function clearTask() {
    $(taskPage).find("form").fromObject({});
  }

  function renderTable() {
    $.each($(taskPage).find("#tblTasks tbody tr"), function (idx, row) {
      var due = Date.parse($(row).find("[datetime]").text());

      if (due.compareTo(Date.today()) < 0) {
        $(row).addClass("overdue");
      } else if (due.compareTo((2).days().fromNow()) <= 0) {
        $(row).addClass("warning");
      }
    });
  }
  function taskCountChanged() {
    var count = $(taskPage).find("#tblTasks tbody tr").length;
    $("footer").find("#taskCount").text(count);
  }
  function errorLogger(errorCode, errorMessage) {
    console.log(errorCode + ":" + errorMessage);
  }

  return {
    init: function (page, callback) {
      if (initialised) {
        callback();
      } else {
        taskPage = page;
        storageEngine.init(function () {
          storageEngine.initObjectStore(
            "task",
            function () {
              callback();
            },
            errorLogger
          );
        }, errorLogger);
        $(taskPage)
          .find("#btnCloseDatabase")
          .click(function (evt) {
            evt.preventDefault();
            console.log("btnCLoseDatabase");
            storageEngine.closeSession();
          });
        $(taskPage)
          .find("#clearTask")
          .click(function (evt) {
            evt.preventDefault();
            clearTask();
          });

        $(taskPage)
          .find('[required="required"]')
          .prev("label")
          .append("<span></span>")
          .children("span")
          .addClass("required");
        $(taskPage).find("tbody tr:even").addClass("even");

        $(taskPage)
          .find("#btnAddTask")
          .click(function (evt) {
            evt.preventDefault();
            $(taskPage).find("#taskCreation").removeClass("not");
          });

        $(taskPage)
          .find("tbody tr")
          .click(function (evt) {
            $(evt.target)
              .closest("td")
              .siblings()
              .addBack()
              .toggleClass("rowHighlight");
          });

        $(taskPage)
          .find("#tblTasks tbody")
          .on("click", ".deleteRow", function (evt) {
            evt.preventDefault();
            storageEngine.delete(
              "task",
              $(evt.target).data().taskId,
              function () {
                $(evt.target).parents("tr").remove();
                taskCountChanged();
              },
              errorLogger
            );
          });

        $(taskPage)
          .find("#saveTask")
          .click(function (evt) {
            evt.preventDefault();
            if ($(taskPage).find("form").valid()) {
              var task = $("form").toObject();
              storageEngine.save(
                "task",
                task,
                function () {
                  $(taskPage).find("#tblTasks tbody").empty();
                  tasksController.loadTasks();
                  clearTask();
                  $(taskPage).find("#taskCreation").addClass("not");
                },
                errorLogger
              );
            }
          });

        $(taskPage)
          .find("#tblTasks tbody")
          .on("click", ".editRow", function (evt) {
            $(taskPage).find("#taskCreation").removeClass("not");
            storageEngine.findById(
              "task",
              $(evt.target).data().taskId,
              function (task) {
                $(taskPage).find("form").fromObject(task);
              },
              errorLogger
            );
          });
        $(taskPage)
          .find("#tblTasks tbody")
          .on("click", ".completeRow", function (evt) {
            storageEngine.findById(
              "task",
              $(evt.target).data().taskId,
              function (task) {
                task.complete = true;
                storageEngine.save(
                  "task",
                  task,
                  function () {
                    tasksController.loadTasks();
                  },
                  errorLogger
                );
              },
              errorLogger
            );
          });

        $(taskPage)
          .find("#btnPrint")
          .click(function (evt) {
            evt.preventDefault();
            var formObject = $(taskPage).find("form").toObject();
            console.log(JSON.stringify(formObject, null, 2));
          });

        $(taskPage)
          .find("#btnLoadObject")
          .click(function (evt) {
            evt.preventDefault();
            var demoObject = {
              task: "This is a demo description.",
              requiredBy: "2024-12-31",
              category: "Work",
            };
            $(taskPage).find("form").fromObject(demoObject);
          });

        initialised = true;
      }
    },

    loadTasks: function () {
      $(taskPage).find("#tblTasks body").empty();
      storageEngine.findAll(
        "task",
        function (tasks) {
          $.each(tasks, function (index, task) {
            if (!task.complete) {
              task.complete = false;
            }
            $("#taskRow")
              .tmpl(task)
              .appendTo($(taskPage).find("#tblTasks tbody"));

            taskCountChanged();
            renderTable();
          });
        },
        errorLogger
      );
    },
  };
})();
