import { gql, useMutation, useSubscription } from '@apollo/client'
import { useEffect, useState } from 'react'
import Chat from './components/Chat'

const LOGIN_USER = gql`
  mutation LoginUser($userId: String!, $partnerId: String!) {
    loginUser(userId: $userId, partnerId: $partnerId)
  }
`

const LOGOUT_USER = gql`
  mutation LogoutUser($userId: String!) {
    logoutUser(userId: $userId)
  }
`

const USER_LOGGED_OUT = gql`
  subscription UserLoggedOut($userId: String!) {
    userLoggedOut(userId: $userId)
  }
`

export default function Home() {
  const [senderId, setSenderId] = useState('')
  const [receiverId, setReceiverId] = useState('')
  const [startChat, setStartChat] = useState(false)

  const [loginUser] = useMutation(LOGIN_USER)
  const [logoutUser] = useMutation(LOGOUT_USER)

  const { data: logoutSubData } = useSubscription(USER_LOGGED_OUT, {
    variables: { userId: senderId },
    skip: !startChat,
  })

  useEffect(() => {
    if (logoutSubData?.userLoggedOut === receiverId) {
      alert('User has logged out. Ending chat.')
      handleLogout()
    }
  }, [logoutSubData])

  const handleStartChat = async () => {
    if (senderId.trim() && receiverId.trim()) {
      try {
        await loginUser({
          variables: {
            userId: senderId,
            partnerId: receiverId,
          },
        })

        setStartChat(true)
      } catch (error) {
        alert(error.message)
      }
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser({ variables: { userId: senderId } })
    } catch (error) {
      console.error('Logout error:', error.message)
    }
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
