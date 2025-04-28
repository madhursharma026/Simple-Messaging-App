import { useState } from 'react'
import Chat from './components/Chat'

export default function Home() {
  const [senderId, setSenderId] = useState('')
  const [receiverId, setReceiverId] = useState('')
  const [startChat, setStartChat] = useState(false)

  const handleStartChat = () => {
    if (senderId.trim() && receiverId.trim()) {
      setStartChat(true)
    }
  }

  const handleLogout = () => {
    setSenderId('')
    setReceiverId('')
    setStartChat(false)
  }

  return (
    <div className="vh-100 vw-100 d-flex align-items-center justify-content-center bg-light">
      {!startChat ? (
        <div
          className="card shadow p-4"
          style={{ width: '100%', maxWidth: '500px' }}
        >
          <h2 className="text-center mb-4">Enter User ID and Client ID</h2>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Your User ID"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Client/User ID"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="form-control"
            />
          </div>
          <button onClick={handleStartChat} className="btn btn-primary w-100">
            Start Chat
          </button>
        </div>
      ) : (
        <Chat
          senderId={senderId}
          receiverId={receiverId}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}
