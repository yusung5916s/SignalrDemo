"use strict";

const connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

let username = "";
const privateChatWindows = {};
const unreadMessages = {};

document.getElementById("join-button").addEventListener("click", (event) => {
    joinChat();
});

document.getElementById("username-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        joinChat();
    }
});

function joinChat() {
    username = document.getElementById("username-input").value;
    if (username) {
        document.getElementById("username-container").style.display = "none";
        document.getElementById("chat-container").style.display = "flex";
        connection.invoke("Register", username).catch((err) => {
            return console.error(err.toString());
        });
    }
}

function addMessageToChat(list, user, message) {
    const li = document.createElement("li");
    li.className = "message " + (user === username ? "sent" : "received");

    const messageContent = document.createElement("div");
    messageContent.textContent = message;

    if (user !== username) {
        const sender = document.createElement("div");
        sender.className = "sender";
        sender.textContent = user;
        li.appendChild(sender);
    }

    li.appendChild(messageContent);
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
}

connection.on("ReceiveMessage", (user, message, isPrivate, fromUser) => {
    if (isPrivate) {
        const otherUser = fromUser === username ? user : fromUser;
        const chatWindow = privateChatWindows[otherUser];
        if (chatWindow && chatWindow.style.display !== "none") {
            addMessageToChat(chatWindow.querySelector(".private-messages-list"), user, message);
        } else {
            if (!unreadMessages[otherUser]) {
                unreadMessages[otherUser] = 0;
            }
            unreadMessages[otherUser]++;
            updateUserListNotifications();
        }
    } else {
        addMessageToChat(document.getElementById("messages-list"), user, message);
    }
});

connection.on("UpdateUserList", (users) => {
    const usersList = document.getElementById("users-list");
    usersList.innerHTML = "";
    users.forEach((user) => {
        if (user === username) return;

        const li = document.createElement("li");
        li.textContent = user;
        li.dataset.username = user;
        li.addEventListener("dblclick", () => {
            createPrivateChatWindow(user);
        });
        usersList.appendChild(li);
    });
    updateUserListNotifications();
});

function updateUserListNotifications() {
    const usersList = document.getElementById("users-list");
    for (const user in unreadMessages) {
        if (unreadMessages[user] > 0) {
            const userLi = usersList.querySelector(`li[data-username="${user}"]`);
            if (userLi) {
                let notification = userLi.querySelector(".notification");
                if (!notification) {
                    notification = document.createElement("span");
                    notification.className = "notification";
                    userLi.appendChild(notification);
                }
                notification.textContent = unreadMessages[user];
            }
        }
    }
}

document.getElementById("send-button").addEventListener("click", (event) => {
    sendMessage();
});

document.getElementById("message-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

function sendMessage() {
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value;
    if (message) {
        connection.invoke("SendMessage", username, message).catch((err) => {
            return console.error(err.toString());
        });
        addMessageToChat(document.getElementById("messages-list"), username, message);
        messageInput.value = "";
    }
}

function createPrivateChatWindow(user) {
    if (privateChatWindows[user]) {
        privateChatWindows[user].style.display = "block";
        unreadMessages[user] = 0;
        const userLi = document.getElementById("users-list").querySelector(`li[data-username="${user}"]`);
        if (userLi) {
            const notification = userLi.querySelector(".notification");
            if (notification) {
                notification.remove();
            }
        }
        return;
    }

    const chatWindow = document.createElement("div");
    chatWindow.className = "private-chat-window";
    chatWindow.innerHTML = `
        <div class="private-chat-header">
            <span>${user}</span>
            <button class="close-private-chat">-</button>
        </div>
        <ul class="private-messages-list"></ul>
        <div class="private-message-input-container">
            <input type="text" class="private-message-input" placeholder="Type your message..." />
            <button class="send-private-message">Send</button>
        </div>
    `;

    document.body.appendChild(chatWindow);
    privateChatWindows[user] = chatWindow;

    const messagesList = chatWindow.querySelector(".private-messages-list");

    fetch(`/api/chathistory?user1=${username}&user2=${user}`)
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                addMessageToChat(messagesList, item.item1, item.item2);
            });
        });

    const messageInput = chatWindow.querySelector(".private-message-input");
    const sendButton = chatWindow.querySelector(".send-private-message");
    const closeButton = chatWindow.querySelector(".close-private-chat");

    function sendPrivateMessage() {
        const message = messageInput.value;
        if (message) {
            connection.invoke("SendPrivateMessage", username, user, message).catch((err) => {
                return console.error(err.toString());
            });
            addMessageToChat(messagesList, username, message);
            messageInput.value = "";
        }
    }

    sendButton.addEventListener("click", sendPrivateMessage);
    messageInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            sendPrivateMessage();
        }
    });

    closeButton.addEventListener("click", () => {
        chatWindow.style.display = "none";
    });

    unreadMessages[user] = 0;
    const userLi = document.getElementById("users-list").querySelector(`li[data-username="${user}"]`);
    if (userLi) {
        const notification = userLi.querySelector(".notification");
        if (notification) {
            notification.remove();
        }
    }
}

connection.start().catch((err) => {
    return console.error(err.toString());
});
