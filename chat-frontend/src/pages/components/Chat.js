import { gql, useMutation, useQuery, useSubscription } from '@apollo/client'
import { useEffect, useRef, useState } from 'react'
import { RiCheckDoubleLine, RiCheckLine } from 'react-icons/ri'

// GraphQL
const GET_MESSAGES = gql`
  query GetMessages($sender_id: String!, $receiver_id: String!) {
    getMessages(sender_id: $sender_id, receiver_id: $receiver_id) {
      id
      sender_id
      receiver_id
      content
      timestamp
      isRead
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($createMessageInput: CreateMessageInput!) {
    sendMessage(createMessageInput: $createMessageInput) {
      id
      sender_id
      receiver_id
      content
      timestamp
      isRead
    }
  }
`

const MARK_AS_READ = gql`
  mutation MarkAsRead($messageId: Float!) {
    markAsRead(messageId: $messageId) {
      id
      isRead
    }
  }
`

const MESSAGE_SENT = gql`
  subscription MessageSent($sender_id: String!, $receiver_id: String!) {
    messageSent(sender_id: $sender_id, receiver_id: $receiver_id) {
      id
      sender_id
      receiver_id
      content
      timestamp
      isRead
    }
  }
`

const MESSAGE_READ = gql`
  subscription MessageRead($sender_id: String!, $receiver_id: String!) {
    messageRead(sender_id: $sender_id, receiver_id: $receiver_id) {
      id
      sender_id
      receiver_id
      isRead
    }
  }
`

// Chat Component
export default function Chat({ senderId, receiverId, onLogout }) {
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const bottomRef = useRef(null)

  const { data: initialMessagesData } = useQuery(GET_MESSAGES, {
    variables: { sender_id: senderId, receiver_id: receiverId },
  })

  const [sendMessage] = useMutation(SEND_MESSAGE)
  const [markAsRead] = useMutation(MARK_AS_READ)

  const { data: sentData } = useSubscription(MESSAGE_SENT, {
    variables: { sender_id: senderId, receiver_id: receiverId },
  })

  const { data: readData } = useSubscription(MESSAGE_READ, {
    variables: { sender_id: senderId, receiver_id: receiverId },
  })

  // Initial load
  useEffect(() => {
    if (initialMessagesData?.getMessages) {
      setMessages(initialMessagesData.getMessages)
    }
  }, [initialMessagesData])

  // New message received
  useEffect(() => {
    if (sentData?.messageSent) {
      const newMessage = sentData.messageSent
      setMessages((prev) => [...prev, newMessage])

      if (
        document.visibilityState === 'visible' &&
        newMessage.sender_id !== senderId &&
        !newMessage.isRead
      ) {
        handleMarkAsRead(newMessage.id)
      }
    }
  }, [sentData])

  // Message read event
  useEffect(() => {
    if (readData?.messageRead) {
      const updatedMsg = readData.messageRead
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === updatedMsg.id ? { ...msg, isRead: true } : msg
        )
      )
    }
  }, [readData])

  const handleSend = async () => {
    if (!messageInput.trim()) return
    await sendMessage({
      variables: {
        createMessageInput: {
          sender_id: senderId,
          receiver_id: receiverId,
          content: messageInput,
        },
      },
    })
    setMessageInput('')
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      await markAsRead({ variables: { messageId } })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Auto mark unread when user comes back
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        messages.forEach((msg) => {
          if (msg.sender_id !== senderId && !msg.isRead) {
            handleMarkAsRead(msg.id)
          }
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [messages])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="vh-100 vw-100 d-flex flex-column bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white shadow-sm">
        <div className="fw-bold fs-5">
          {senderId} ↔ {receiverId}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-grow-1 overflow-auto p-3"
        style={{ backgroundColor: '#e5ddd5' }}
      >
        <div className="d-flex flex-column gap-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`d-flex ${
                msg.sender_id === senderId
                  ? 'justify-content-end'
                  : 'justify-content-start'
              }`}
            >
              <div
                className={`p-2 rounded position-relative shadow-sm ${
                  msg.sender_id === senderId
                    ? 'bg-primary text-white'
                    : 'bg-white text-dark'
                }`}
                style={{
                  maxWidth: '75%',
                  minWidth: '100px',
                  wordBreak: 'break-word',
                  fontSize: '15px',
                  lineHeight: '1.4',
                }}
              >
                <div className="mb-1">{msg.content}</div>
                <div className="d-flex justify-content-end align-items-center gap-1 small opacity-75 mt-1">
                  <span style={{ fontSize: '11px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {msg.sender_id === senderId && (
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginLeft: '5px',
                      }}
                    >
                      {msg.isRead ? <RiCheckDoubleLine /> : <RiCheckLine />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-top p-3 bg-white">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
