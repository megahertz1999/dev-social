import React, { Fragment } from 'react';
import './App.css';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Landing from './components/layouts/Landing';
import Navbar from './components/layouts/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

const App = () => {
  return (
    <BrowserRouter>
      <Fragment>
        <Navbar />
        <Route exact path='/' component={Landing} />
        <section className='container'>
          <Switch>
            <Route exact path='/login' component={Login} />
            <Route exact path='/register' component={Register} />
          </Switch>
        </section>
      </Fragment>
    </BrowserRouter>
  );
};

export default App;
