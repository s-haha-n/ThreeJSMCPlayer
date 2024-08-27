import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

export default function LoginPage() {

  const navigate = useNavigate();
  const [formInputs, setFormInputs] = useState({username:"",password:""});
  const [searchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormInputs(values => ({...values, [name]: value}))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('username',formInputs.username);
    console.log(formInputs);
    if (worldId) {
      console.log("Entering world " + worldId);
      navigate('/world', { state: { peerId:worldId, username:formInputs.username }});
    } else {
      navigate('/home');
    }
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