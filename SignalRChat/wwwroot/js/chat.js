"use strict";

const connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

let username = "";
const privateChatWindows = {};

document.getElementById("join-button").addEventListener("click", (event) => {
    username = document.getElementById("username-input").value;
    if (username) {
        document.getElementById("username-container").style.display = "none";
        document.getElementById("chat-container").style.display = "flex";
        connection.invoke("Register", username).catch((err) => {
            return console.error(err.toString());
        });
    }
    event.preventDefault();
});

connection.on("ReceiveMessage", (user, message, isPrivate, fromUser) => {
    if (isPrivate) {
        const chatWindow = privateChatWindows[fromUser] || privateChatWindows[user];
        if (chatWindow) {
            const li = document.createElement("li");
            li.textContent = `${user}: ${message}`;
            chatWindow.querySelector(".private-messages-list").appendChild(li);
        }
    } else {
        const li = document.createElement("li");
        li.textContent = `${user}: ${message}`;
        document.getElementById("messages-list").appendChild(li);
    }
});

connection.on("UpdateUserList", (users) => {
    const usersList = document.getElementById("users-list");
    usersList.innerHTML = "";
    users.forEach((user) => {
        if (user === username) return;

        const li = document.createElement("li");
        li.textContent = user;
        li.addEventListener("dblclick", () => {
            createPrivateChatWindow(user);
        });
        usersList.appendChild(li);
    });
});

document.getElementById("send-button").addEventListener("click", (event) => {
    const message = document.getElementById("message-input").value;
    connection.invoke("SendMessage", username, message).catch((err) => {
        return console.error(err.toString());
    });
    document.getElementById("message-input").value = "";
    event.preventDefault();
});

function createPrivateChatWindow(user) {
    if (privateChatWindows[user]) {
        privateChatWindows[user].style.display = "block";
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

    const messageInput = chatWindow.querySelector(".private-message-input");
    const sendButton = chatWindow.querySelector(".send-private-message");
    const closeButton = chatWindow.querySelector(".close-private-chat");

    sendButton.addEventListener("click", () => {
        const message = messageInput.value;
        if (message) {
            connection.invoke("SendPrivateMessage", username, user, message).catch((err) => {
                return console.error(err.toString());
            });
            messageInput.value = "";
        }
    });

    closeButton.addEventListener("click", () => {
        chatWindow.style.display = "none";
    });
}

connection.start().catch((err) => {
    return console.error(err.toString());
});
