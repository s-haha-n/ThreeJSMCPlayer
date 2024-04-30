import { useState } from 'react';
import { Tooltip } from 'react-tooltip'

export default function RegisterPage() {

  const [formInputs, setFormInputs] = useState({username:"",password:"",passwordConf:""});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormInputs(values => ({...values, [name]: value}))
  }

  const passStrength = [false,false,false,false];

  const checkPassStrength = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    setFormInputs(values => ({...values, [e.target.name]: e.target.value}))
    const strength = 0;
    if (formInputs["password"].match(/\d+/g)) {
      passStrength[0] = true
    }
    if (formInputs["password"].match(/\d+/g))
  }

  const confirmPassword = () => {
    if(formInputs["password"] === formInputs["passwordConf"]) {
      return true
    } else {
      return false
    }
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((confirmPassword())) {
      console.log(formInputs);  
    } else {
      console.log("passwords didn't match");
    }
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
        <span 
          data-tooltip-id="password-tip"
          data-tooltip-content="Hello world!"
          data-tooltip-place="right"
          >?</span>
        <Tooltip id="password-tip" />
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