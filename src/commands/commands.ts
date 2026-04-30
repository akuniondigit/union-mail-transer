Office.onReady(() => {
  // ribbon command actions are wired via Office.actions.associate below
});

function showTaskpane(event: Office.AddinCommands.Event): void {
  // Task pane is opened by manifest's ShowTaskpane action; this handler just completes the event.
  event.completed();
}

Office.actions.associate("showTaskpane", showTaskpane);
