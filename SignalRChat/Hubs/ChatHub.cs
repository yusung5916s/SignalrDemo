using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace SignalRChat.Hubs
{
    public class ChatHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> Users = new ConcurrentDictionary<string, string>();

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            string username = Users.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
            if (username != null)
            {
                Users.TryRemove(username, out _);
                await Clients.All.SendAsync("UpdateUserList", Users.Keys);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task Register(string username)
        {
            if (Users.TryAdd(username, Context.ConnectionId))
            {
                await Clients.All.SendAsync("UpdateUserList", Users.Keys);
            }
        }

        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message, false);
        }

        public async Task SendPrivateMessage(string sender, string receiver, string message)
        {
            if (Users.TryGetValue(receiver, out string? receiverConnectionId))
            {
                await Clients.Client(receiverConnectionId).SendAsync("ReceiveMessage", sender, message, true);
                await Clients.Caller.SendAsync("ReceiveMessage", sender, message, true);
            }
        }
    }
}
