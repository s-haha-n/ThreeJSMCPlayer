import { useState } from 'react';
import { Tooltip } from 'react-tooltip'

export default function RegisterPage() {

  const [formInputs, setFormInputs] = useState({username:"",password:"",passwordConf:""});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormInputs(values => ({...values, [name]: value}));
  }

  const checkPassStrength = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    setFormInputs(values => ({...values, [e.target.name]: e.target.value}));
    var strength = 0;
    //at least 8 characters
    if (formInputs["password"].match(/.{8,}/g)) {
      strength += 1;
    }
    //at least one digit
    if (formInputs["password"].match(/\d+/g)){
      strength += 1;
    }
    //at least one lowercase letter
    if (formInputs["password"].match(/[a-z]+/g)){
      strength += 1;
    }
    //at least one capital letter
    if (formInputs["password"].match(/[A-Z]+/g)){
      strength += 1;
    }
    return strength;
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