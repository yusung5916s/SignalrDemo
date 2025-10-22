using Microsoft.AspNetCore.Mvc;
using SignalRChat.Hubs;
using System;
using System.Collections.Generic;

namespace SignalRChat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatHistoryController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get(string user1, string user2)
        {
            var key = string.Compare(user1, user2) < 0 ? $"{user1}-{user2}" : $"{user2}-{user1}";
            if (ChatHub.PrivateMessages.TryGetValue(key, out var messages))
            {
                return Ok(messages);
            }
            return Ok(new List<Tuple<string, string, DateTime>>());
        }
    }
}
