import { useRef } from "react";
import "./style.css";

export function UserInfo({pfp, email, name}) {
    return (
        <div className="user_info_container">

            <img src={pfp} alt="User profile picture" className="user_info_pfp" referrerPolicy="no-referrer"/>

            <div>
                <h3>{name}</h3>
                <p className="user_info_email">{email}</p>
            </div>

        </div>
    )
}