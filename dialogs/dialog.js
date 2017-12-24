const dialogs = {
    helloWorld: (session) => {
        session.send("hello");
        session.endDialog();
    }
};

module.exports = dialogs;