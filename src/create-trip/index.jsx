import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog"

import { FcGoogle } from "react-icons/fc";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../service/firebaseConfig"
import { useEffect, useState } from "react";
// import GooglePlacesAutocomplete from "react-google-places-autocomplete";

import { Input } from "@/components/ui/input"
import { SelectBudgetOptions, SelectTravelesList, AI_PROMPT } from "@/constants/options";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { toast } from "sonner"
import { chatSession } from "@/service/AImodel";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateTrip() {
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState([]);
  const [openDailog, setOpenDailog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handeInputChange = (name, value) => {
    // if(name =='no0fDays'&&value>7){
    //   console.log(`Please enter days less than 7`);
    //   return;
    // }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }

  useEffect(() => {
    console.log(formData);
  }
    , [formData])

  const onGenerateTrip = async () => {

    const user = localStorage.getItem('user');

    if (!user) {
      setOpenDailog(true)
      toast("Please login to continue")
      return;
    }

    if (formData?.noOfDays > 7 && !formData?.location || !formData?.budget || !formData?.people) {
      toast("Please fill all the details.")

      return;
    }

    console.log(formData);
    //set loading state
    setLoading(true);


    const FINAL_PROMPT = AI_PROMPT
      .replace('{location}', formData?.location)
      .replace('{totalDays}', formData?.noOfDays)
      .replace('{traveler}', formData?.people)
      .replace('{budget}', formData?.budget)
      .replace('{totalDays}', formData?.noOfDays)

    console.log(FINAL_PROMPT);
    //getting data from api

    const result = await chatSession.sendMessage(FINAL_PROMPT);
    console.log("--", result?.response?.text());
    setLoading(false);
    SaveAITrip(result?.response?.text());

  }

  //login

  const login = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: (error) => console.log(error),
  })
  //logout

  // const logout = useGoogleLogin({
  //   onSuccess:(codeResp)=>console.log(codeResp),
  //   onError:(error)=>console.log(error),
  // })

  const navigate = useNavigate();

  // use axios for get http request


  const GetUserProfile = (tokenInfo) => {
    axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {


      headers: {
        Authorization: `Bearer ${tokenInfo?.access_token}`,
        Accept: 'application/json'
      }
    }).then((resp) => {
      console.log(resp.data);
      localStorage.setItem('user', JSON.stringify(resp.data));
      setOpenDailog(false)
      onGenerateTrip();
    })
  }


  // for saving data in data base db

  const SaveAITrip = async (TripData) => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const docID = Date.now().toString();
    // Add a new document in collection "cities"
    await setDoc(doc(db, "AITrips", docID), {
      userSelection: formData,
      tripData: JSON.parse(TripData),
      userEmail: user?.email,
      id: docID

    });
    setLoading(false);
    toast("✅ Trip Generated Successfully")
    navigate("/view-trip/" + docID)
  }




  return (
    <div className="sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10">
      <h2 className=" font-bold text-3xl">Tell us your travel preferences 🌴📍</h2>
      <p className="mt-3 text-gray-500 text-xl">Just provide some basic information, and our trip planner will generate a customized itinerary based
        on your preferences.</p>

      <div className="mt-20 flex flex-col gap-10">
        <div className="">
          <h2 className="text-xl my-3 font-medium">What is destination of choice ?
          </h2>

          <Input
            placeholder="India"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            onBlur={() => handeInputChange('location', place)}
          />


          {/* <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              selectProps={{ place,
                onChange:(v)=>{setPlace(v) 
                  console.log(v)}
              }}
                  /> */}
        </div>
        <div>
          <h2 className="text-xl my-3 font-medium">How many days are you planning your trip ?
          </h2>
          <Input placeholder={'Ex.3'}
            type="number"
            onChange={(e) => handeInputChange('noOfDays', e.target.value)} />
        </div>
      </div>

      <div>
        <h2 className='text-xl my-3 font-medium'>What is Your Budget?</h2>
      </div>
      <div className="grid grid-flow-col gap-5 mt-4">
        {SelectBudgetOptions.map((item, index) => (
          <div key={index} onClick={() => handeInputChange('budget', item.title)}
            className={`text-black p-4 border rounded-lg hover:shadow-lg cursor-pointer bg-white ${formData?.budget == item.title && 'shadow-ld border-black'}`}>
            <h2 className="text-xl">{item.icon}</h2>
            <h2 className="font-bold">{item.title}</h2>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className='text-xl my-3 font-medium'>Who do you plan on traveling with on your next adventure?</h2>
      </div>
      <div className="grid grid-flow-col gap-5 mt-4 ">
        {SelectTravelesList.map((item, index) => (
          <div key={index} onClick={() => handeInputChange('people', item.people)}
            className={`text-black p-4 border rounded-lg hover:shadow-lg cursor-pointer bg-white ${formData?.people == item.people && 'shadow-ld border-black'}`}>
            <h2 className="text-xl">{item.icon}</h2>
            <h2 className="font-bold">{item.title}</h2>
            <p className="text-sm text-gray-500"> {item.desc}</p>
          </div>
        ))}
      </div>
      <div id="hi" className="my-10 justify-end flex" >
        <Button onClick={onGenerateTrip} >
          {loading ?
            <AiOutlineLoading3Quarters className="h-7 w-7 animate-spin" /> : "Generate Trip"
          }
        </Button>
      </div>

      <Dialog open={openDailog}>

        {/* <DialogTrigger  open={openDailog} >Open</DialogTrigger> */}
        <DialogContent>
          <Button onClick={() => setOpenDailog(false)} className="bg-white h-1 flex flex-row justify-end hy hover:bg-white">❌</Button>
          <DialogHeader>

            <DialogDescription>

              <img src="/logo.png" />
              <h2 className="font-bold text-lg mt-7">Sign In With Google</h2>
              <p>Sign in to the App with Google authentication secuarly</p>
              <Button

                onClick={login}
                className="w-full mt-5 flex gap-4 items-center">
                <FcGoogle />
                Sign In with Google
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>


    </div>
  )
}

export default CreateTrip;
