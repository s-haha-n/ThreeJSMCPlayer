import { useState } from 'react';

export default function LoginPage() {

  const [formInputs, setFormInputs] = useState({username:"",password:""});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormInputs(values => ({...values, [name]: value}))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formInputs);
  }
  
  return (
    <div className='loginForm'>
      <form onSubmit={handleSubmit}>
        <label>Username
        <input 
          type="text" 
          name="username" 
          value={formInputs.username || ""} 
          onChange={handleChange}
        />
        </label>
        <label>Password
        <input 
          type="text" 
          name="password" 
          value={formInputs.password || ""} 
          onChange={handleChange}
        />
        </label>
        <input type="submit" value="LOGIN"/>
      </form>
    </div>
  );
}