import React, { useEffect, useState } from 'react';
import {
  initSocket,
  connectSocket,
  disconnectSocket,
  joinTrain,
  leaveTrain,
  onSeatHold,
  onSeatReserved,
  onSeatRelease,
  setAuthToken
} from '../socketClient';

export default function TrainSeatsRealtime({ trainId, token }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    initSocket({});
    if (token) setAuthToken(token);
    connectSocket();

    joinTrain(trainId);

    const holdHandler = (payload) => setEvents((s) => [`hold ${JSON.stringify(payload)}`, ...s].slice(0, 10));
    const reservedHandler = (payload) => setEvents((s) => [`reserved ${JSON.stringify(payload)}`, ...s].slice(0, 10));
    const releaseHandler = (payload) => setEvents((s) => [`release ${JSON.stringify(payload)}`, ...s].slice(0, 10));

    onSeatHold(holdHandler);
    onSeatReserved(reservedHandler);
    onSeatRelease(releaseHandler);

    return () => {
      leaveTrain(trainId);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainId, token]);

  return (
    <div>
      <h4>Sự kiện ghế thời gian thực</h4>
      <ul>
        {events.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
