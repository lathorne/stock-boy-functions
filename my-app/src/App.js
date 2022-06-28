import './App.css';

import Autocomplete from './Autocomplete';
import FrontPage from './FrontPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, limit, query, startAfter } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { getAuth, signInAnonymously } from "firebase/auth";
import DataPage from './DataPage';
import BottomPage from './BottomPage';
import { prelim_tickers } from  './Tickers';
import { Row, Col } from "react-bootstrap";
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faSpinner, faMagnifyingGlass)

const firebaseConfig = {
  apiKey: "AIzaSyDLDqpB2jA1pUG8K7jiafhKjzTjQfilWe0",
  authDomain: "stock-boy-3d183.firebaseapp.com",
  projectId: "stock-boy-3d183",
  storageBucket: "stock-boy-3d183.appspot.com",
  messagingSenderId: "507833524956",
  appId: "1:507833524956:web:b4b743090f1c6af4560a19",
  measurementId: "G-ESNX47QJKM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth();
signInAnonymously(auth)
  .then(() => {
    // Signed in..
  })
  .catch((error) => {
    console.log("anon sign in failed with error: ", error.code, error.message)
  });

var currentCompany = ''

var cacheDict = {}

async function retrieveTickerData(){
  var ticker_list = []
  console.log('getting tickers')

  const q1 = query(collection(db, "tickers"), limit(4000))
  const querySnapshot1 = await getDocs(q1);
  const lastVisible1 = querySnapshot1.docs[querySnapshot1.docs.length-1];
  const q2 = query(collection(db, "tickers"), startAfter(lastVisible1), limit(4000))
  const querySnapshot2 = await getDocs(q2);
  const lastVisible2 = querySnapshot2.docs[querySnapshot2.docs.length-1];
  const q3 = query(collection(db, "tickers"), startAfter(lastVisible2), limit(4000))
  const querySnapshot3 = await getDocs(q3);

  querySnapshot1.forEach((doc) => {
    for (const [key, value] of Object.entries(doc.data())) {
      if (value === "null"){
        ticker_list.push(key + '?' + doc.id)
      }else{
        ticker_list.push(key + ':' + value + '?' + doc.id )
      }
    }
  });
  querySnapshot2.forEach((doc) => {
    for (const [key, value] of Object.entries(doc.data())) {
      if (value === "null"){
        ticker_list.push(key + '?' + doc.id)
      }else{
        ticker_list.push(key + ':' + value + '?' + doc.id )
      }
    }
  });
  querySnapshot3.forEach((doc) => {
    for (const [key, value] of Object.entries(doc.data())) {
      if (value === "null"){
        ticker_list.push(key + '?' + doc.id)
      }else{
        ticker_list.push(key + ':' + value + '?' + doc.id )
      }
    }
  });
  console.log('tickers retrieved')
  return ticker_list;
}

async function retrieveCompanyData(cik){
  if (cik in cacheDict){
    console.log('cacheDict hit for cik ' + cik)
    return cacheDict[cik]
  }
  var data = {}
  const docRef = doc(db, "data_v2", cik)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    data["data"] = docSnap.data()
  } else {
    data["data"] = "undefined"
    console.log("No such analyzed with cik: ", cik);
  }
  const docRef2 = doc(db, "financial_links", cik)
  const docSnap2 = await getDoc(docRef2)
  if (docSnap2.exists()) {
    data["financials"] = docSnap2.data()
  } else {
    data["financials"] = "undefined"
    console.log("No such financial statements with cik: ", cik);
  }
  console.log('setting in cache dict')
  cacheDict[cik] = data;
  return data
}

function App() {

  const [tickerList, setTickerList] = useState([]);
  const [company, setCompany] = useState();
  const [companyFinancialsDict, setCompanyFinancialsDict] = useState();
  const [companyDataDict, setCompanyDataDict] = useState();
  const [loading, setLoading] = useState();

  const pull_data = (selection) => {
    var split_selection = selection.split("\n")
    if(split_selection.length !== 2){
      split_selection = selection.split("?")
    }
    
    setLoading(true)
    retrieveCompanyData(split_selection[1]).then(new_dict =>{
      setCompanyFinancialsDict(new_dict["financials"])
      setCompany(split_selection[0])
      setCompanyDataDict(new_dict["data"])
      setLoading(false)
    })
  }

  // Use an effect to load the ticker list from the database
  useEffect(() => {
    if(tickerList.length === 0){
      setTickerList(prelim_tickers)
      // console.log('set prelim tickers')
      // setLoading(true)
      // retrieveTickerData().then(new_list => {
      //   setTickerList(new_list)
      //   setLoading(false)
      // })
    }
    if(currentCompany !== company){
    }
  }, [tickerList.length, company]);

  if(loading){
    return (
      <div>
          <div className="container-fluid d-flex align-items-center justify-content-center new-nav">
            <Row>
              <Col>
                <form className="form-inline">
                  <Autocomplete id="autocomplete" suggestions={tickerList} func={pull_data}/>
                </form>
              </Col>
            </Row>
          </div>
        <div className="content">
          <FontAwesomeIcon icon="fa-solid fa-spinner fa-xl" style ={{color: '#0d6efd',"marginTop":"5em","marginBottom":"2em"}} pulse/>
        </div>
      </div>
    );
  }else if(typeof companyDict === "undefined" && typeof company === "undefined"){
    return (
      <div>
          <div className="container-fluid d-flex align-items-center justify-content-center new-nav"> 
            <form className="form-inline">
              <Autocomplete id="autocomplete" suggestions={tickerList} func={pull_data}/>
            </form>
          </div>
        <div className="content">
          <FrontPage/>
        </div>
        <BottomPage/>
      </div>
    );
  }else{
    return (
      <div>
          <div className="container-fluid d-flex align-items-center justify-content-center new-nav">            
            <Row>
              <Col>
                <form className="form-inline">
                  <Autocomplete id="autocomplete" suggestions={tickerList} func={pull_data}/>
                </form>
              </Col>
            </Row>
          </div>
        <div className="content">
          <DataPage company={company} companyFinancialsDict={companyFinancialsDict} companyDataDict={companyDataDict}/>
        </div>
        <BottomPage/>
      </div>
    );
  }
}

export default App;
