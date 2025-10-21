"use strict";

const connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

let username = "";
let selectedUser = null;

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

connection.on("ReceiveMessage", (user, message, isPrivate) => {
    const li = document.createElement("li");
    li.textContent = `${user}: ${message}`;
    if (isPrivate) {
        li.classList.add("private-message");
    }
    document.getElementById("messages-list").appendChild(li);
});

connection.on("UpdateUserList", (users) => {
    const usersList = document.getElementById("users-list");
    usersList.innerHTML = "";
    users.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user;
        if (user === username) {
            li.style.fontWeight = "bold";
        }
        li.addEventListener("click", () => {
            const allUsers = usersList.getElementsByTagName("li");
            if (selectedUser === user) {
                // Deselect the user
                selectedUser = null;
                li.style.backgroundColor = "";
            } else {
                // Select a new user
                selectedUser = user;
                for (let i = 0; i < allUsers.length; i++) {
                    allUsers[i].style.backgroundColor = "";
                }
                li.style.backgroundColor = "#ddd";
            }
        });
        usersList.appendChild(li);
    });
});

document.getElementById("send-button").addEventListener("click", (event) => {
    const message = document.getElementById("message-input").value;
    if (selectedUser) {
        connection.invoke("SendPrivateMessage", username, selectedUser, message).catch((err) => {
            return console.error(err.toString());
        });
    } else {
        connection.invoke("SendMessage", username, message).catch((err) => {
            return console.error(err.toString());
        });
    }
    document.getElementById("message-input").value = "";
    event.preventDefault();
});

connection.start().catch((err) => {
    return console.error(err.toString());
});
