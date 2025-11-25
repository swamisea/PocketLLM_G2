import { useState, FormEvent } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import axios, { AxiosError } from 'axios'
import './LoginComponent.css'

interface LoginProps {
  onLogin: (user: { email: string }) => void
}

interface LoginUserResponse{
  valid: boolean;
  message: string;
}

function Login({ onLogin }: LoginProps) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async(e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        email,
        password
      })
      
      // Success
      if (response.data.success) {
        console.log(response)
        onLogin({ email })
      }
    } catch (error) {
      console.log(error)
      // Axios throws for 4xx/5xx responses
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as LoginUserResponse
        
        if (errorData?.message) {
          setError(errorData.message)
        }
      } else {
        // Network error or unexpected error
        setError('Network error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }

    console.log('Logging in with:', { email, password })
    onLogin({ email })
  }

  return (
    <div className="login-wrapper">
      {/* Left side - Form */}
      <div className="login-container">
        <div className="form-container">
          <h1 className="page-greeting text-light mb-2">
            Welcome to PocketLLM
          </h1>

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

            <Button 
              className="btn-submit px-5 py-2"
              type="submit" 
            >
              {isLoading? 'Logging in...' : 'Login'}
            </Button>

            <p className="text-light mt-4 small">
              Don't have an account? <Link to="/signup" className="text-light">Sign Up</Link>
            </p>
          </Form>
        </div>
      </div>

      {/* Right side - Image */}
      <div className='img-login'/>
    </div>
  )
}

export default Login