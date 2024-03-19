import { useState } from 'react';

export default function RegisterPage() {

  const [formInputs, setFormInputs] = useState({username:"",password:"",passwordConf:""});

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
    <div className='registerForm'>
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
        <label>Confirm Password
        <input 
          type="text" 
          name="passwordConf" 
          value={formInputs.passwordConf || ""} 
          onChange={handleChange}
        />
        </label>
        <input type="submit" value="Register"/>
      </form>
    </div>
  );
}