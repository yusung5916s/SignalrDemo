"use strict";

const connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

let username = "";
const privateChatWindows = {};
const unreadMessages = {};

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
        const otherUser = fromUser === username ? user : fromUser;
        const chatWindow = privateChatWindows[otherUser];
        if (chatWindow && chatWindow.style.display !== "none") {
            const li = document.createElement("li");
            li.textContent = `${user}: ${message}`;
            chatWindow.querySelector(".private-messages-list").appendChild(li);
        } else {
            if (!unreadMessages[otherUser]) {
                unreadMessages[otherUser] = 0;
            }
            unreadMessages[otherUser]++;
            updateUserListNotifications();
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

    fetch(`/api/chathistory?user1=${username}&user2=${user}`)
        .then(response => response.json())
        .then(data => {
            const messagesList = chatWindow.querySelector(".private-messages-list");
            data.forEach(item => {
                const li = document.createElement("li");
                li.textContent = `${item.item1}: ${item.item2}`;
                messagesList.appendChild(li);
            });
        });

    const messageInput = chatWindow.querySelector(".private-message-input");
    const sendButton = chatWindow.querySelector(".send-private-message");
    const closeButton = chatWindow.querySelector(".close-private-chat");

    sendButton.addEventListener("click", () => {
        const message = messageInput.value;
        if (message) {
            connection.invoke("SendPrivateMessage", username, user, message).catch((err) => {
                return console.error(err.toString());
            });
            const li = document.createElement("li");
            li.textContent = `${username}: ${message}`;
            chatWindow.querySelector(".private-messages-list").appendChild(li);
            messageInput.value = "";
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
