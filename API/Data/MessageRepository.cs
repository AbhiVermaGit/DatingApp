using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
        public class MessageRepository : IMessageRepository
        {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
                public MessageRepository(DataContext context, IMapper mapper)
                {
                    _mapper = mapper;
                    _context = context;
                }

                public void AddMessage(Message message)
                {
                    _context.Messages.Add(message);
                }

                public void DeleteMessage(Message message)
                {
                    _context.Messages.Remove(message);
                }

                public async Task<Message> GetMessage(int id)
                {
                    return await _context.Messages
                        .Include(u => u.Sender)                  // including Sender and Recipient b/c it is needed in message controller -> deleteMessage()
                        .Include(u => u.Recipient)
                        .SingleOrDefaultAsync(x => x.Id == id);
                }

                public async Task<PagedList<MessageDto>> GetMessagesForUser(MessageParams messageParams)
                {
                    var query = _context.Messages
                        .OrderByDescending(m => m.MessageSent)
                        .AsQueryable();

                    //now check the container, and depending on which container it is 
                    //we will depend on which messages we return

                    query = messageParams.Container switch
                    {
                        "Inbox" => query.Where(u => u.RecipientUsername == messageParams.Username
                             && u.RecipientDeleted == false),
                        "Outbox" => query.Where(u => u.Sender.UserName == messageParams.Username
                            && u.SenderDeleted == false),
                        _ => query.Where(u => u.RecipientUsername == messageParams.Username
                            && u.RecipientDeleted == false && u.DateRead == null)
                    };

                    var messages = query.ProjectTo<MessageDto>(_mapper.ConfigurationProvider);

                    return await PagedList<MessageDto>.CreateAsync(messages, messageParams.PageNumber,messageParams.PageSize);
                }

                public async Task<IEnumerable<MessageDto>> GetMessageThread(string currentUsername,
                    string recipentUsername)
                {
                    //message conversation b/w two users
                    //1 to 1 and vice versa
                    
                    var messages = await _context.Messages
                    .Include(u => u.Sender).ThenInclude(p => p.Photos)
                    .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                    .Where( m => m.Recipient.UserName == currentUsername && m.RecipientDeleted == false
                            && m.Sender.UserName == recipentUsername
                            || m.Recipient.UserName == recipentUsername
                            && m.Sender.UserName == currentUsername && m.SenderDeleted == false

                    )
                    .OrderBy(m => m.MessageSent)
                    .ToListAsync();

                    //checking if message read
                    var unreadMessages = messages.Where(m => m.DateRead == null
                        && m.RecipientUsername == currentUsername).ToList();

                    //looping for unread messages
                    if(unreadMessages.Any())
                    {
                        foreach (var message in unreadMessages)
                        {
                            message.DateRead = DateTime.Now;
                        }

                        await _context.SaveChangesAsync();
                    }

                    return _mapper.Map<IEnumerable<MessageDto>>(messages);                   
                }
                public async Task<bool> SaveAllASync()
                {
                    return await _context.SaveChangesAsync() > 0;
                }
        }
}