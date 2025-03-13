import {useState} from 'react';
import {useNavigate,Link} from 'react-router-dom';
import './login.css';
// import bcrypt from 'bcrypt';
// const bcrypt = require('bcryptjs');

function Login(){
    const [identifier,setIdentifier]=useState('');
    const [password,setPassword]=useState('');
    const navigate=useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password }),
            });
    
            const data = await response.json();
            
            if (response.ok) {
                console.log('Login successful:', data); // Debug log
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                navigate('/dashboard');
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error during login');
        }
    };


    return(
        <div className='loginDiv'>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="text"
                        placeholder="UserID/Email"
                        value={identifier}
                        onChange={(e)=>setIdentifier(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <div className="register-link">
                <p>New user? <Link to="/register">Create Account</Link></p>
            </div>
        </div>
    )
};

export default Login;