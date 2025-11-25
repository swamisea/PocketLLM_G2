import { useState, FormEvent } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import './SignUpComponent.css'

interface SignUpProps {
  onSignUp: (user: { email: string }) => void
}

function SignUp({ onSignUp }: SignUpProps) {
  const [email, setEmail] = useState<string>('')
  const [userName, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    
    console.log('Signing up with:', { email, password })
    onSignUp({ email })
  }

  return (
    <div className="signup-wrapper">
      {/* Left side - Form */}
      <div className="signup-container">
        <div className="form-container">
          <h1 className="page-greeting text-light mb-2">
            Welcome to PocketLLM
          </h1>
          <p className="text-light mb-4">
            Don't have an account yet? Sign up below.
          </p>

          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-4" controlId="email">
              <Form.Label className="text-light small">Email</Form.Label>
              <Form.Control
                className='form-field'
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="username">
              <Form.Label className="text-light small">Username</Form.Label>
              <Form.Control
                className='form-field'
                type="text"
                value ={userName}
                onChange={(uname) => setUsername(uname.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <div className="d-flex justify-content-between">
                <Form.Label className="text-light small">Password</Form.Label>
                <span 
                  className="text-light small form-field-password" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              <Form.Control
                className='form-field'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            {/* Password requirements */}
            <div className="password-rules text-light mb-4">
              <span>● Use 8 or more characters</span>
              <span>● One Uppercase character</span>
              <span>● One lowercase character</span>
              <span>● One special character</span>
              <span>● One number</span>
            </div>

            <Button 
              className="btn-submit px-5 py-2"
              type="submit" 
            >
              Create an account
            </Button>

            <p className="text-light mt-4 small">
              Already have an account? <Link to="/login" className="text-light">Log in</Link>
            </p>
          </Form>
        </div>
      </div>

      {/* Right side - Image */}
      <div className='img-signup'/>
    </div>
  )
}

export default SignUp