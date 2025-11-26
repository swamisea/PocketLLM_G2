import { useState, FormEvent, ChangeEvent } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { Link } from 'react-router'
import type { ValidationErrors } from '@common/types/account'
import { createUser } from '../../services/account.service'
import './SignUpComponent.css'

interface SignUpProps {
  onSignUp: (user: { email: string; username: string }) => void
}



function SignUp({ onSignUp }: SignUpProps) {
  const [email, setEmail] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [generalError, setGeneralError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    //clear previous errors
    setGeneralError('')
    setValidationErrors({})
    
    if (!email || !password || !username) {
      setGeneralError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const response = await createUser({
        email,
        username,
        password
      })
      
      // Success
      if (response.success) {
        console.log(response)
        onSignUp({ email, username })
      }else{
        if (response.errors) {
          setValidationErrors(response.errors)
        } else if (response.message) {
          setGeneralError(response.message)
        } else {
          setGeneralError('Failed to create account')
        }
      }
    } catch (error) {
      console.log("Sign Up Error:", error)
      setGeneralError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
            {generalError && <Alert variant="danger">{generalError}</Alert>}
            
            <Form.Group className="mb-4" controlId="email">
              <Form.Label className="text-light small">Email</Form.Label>
              <Form.Control
                className='form-field'
                type="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                isInvalid = {!!validationErrors.email}
              />
              {validationErrors.email?.map((error, idx) => (
                <Form.Control.Feedback key={idx} type="invalid" style={{display: 'block'}}>
                  {error}
                </Form.Control.Feedback>
              ))}
            </Form.Group>

            <Form.Group className="mb-4" controlId="username">
              <Form.Label className="text-light small">Username</Form.Label>
              <Form.Control
                className='form-field'
                type="text"
                value ={username}
                onChange={(uname: ChangeEvent<HTMLInputElement>) => setUsername(uname.target.value)}
                isInvalid = {!!validationErrors.username}
              />
              {validationErrors.username?.map((error, idx) => (
                <Form.Control.Feedback key={idx} type="invalid" style={{display: 'block'}}>
                  {error}
                </Form.Control.Feedback>
              ))}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                isInvalid={!!validationErrors.password}
              />
              {validationErrors.password?.map((error, idx) => (
                <Form.Control.Feedback key={idx} type="invalid" style={{display: 'block'}}>
                  {error}
                </Form.Control.Feedback>
              ))}
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
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create an account'}
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