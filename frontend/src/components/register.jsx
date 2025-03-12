import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './register.css'

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department_id: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if(formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    department_id:formData.department_id,
                    password: formData.password,
                    role: 'user'  // default role
                }),
            });

            const data = await response.json();

            if(response.ok) {
                alert('Registration successful!');
                navigate('/');  // redirect to login
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to register');
        }
    };

    return (
        <div className='registerDiv'>
            <h2>Create Account</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="text"
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <input
                        type="number"
                        placeholder="Department ID"
                        value={formData.department_id}
                        onChange={(e) => setFormData({...formData, department_id: e.target.value || null})}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
            <div className="login-link">
                <p>Already have an account? <Link to="/">Login</Link></p>
            </div>
        </div>
    );
}

export default Register;