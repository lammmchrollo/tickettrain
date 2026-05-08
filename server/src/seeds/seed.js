require('dotenv').config();
const mongoose = require('mongoose');

const Station = require('../models/station.model');
const Train = require('../models/train.model');
const Carriage = require('../models/carriage.model');
const Seat = require('../models/seat.model');
const Promotion = require('../models/promotion.model');
const Owner = require('../models/owner.model');

const stations = [
  { code: 'HN', name: 'Ha Noi', city: 'Ha Noi' },
  { code: 'VINH', name: 'Vinh', city: 'Nghe An' },
  { code: 'DH', name: 'Dong Hoi', city: 'Quang Binh' },
  { code: 'HUE', name: 'Hue', city: 'Thua Thien Hue' },
  { code: 'DAD', name: 'Da Nang', city: 'Da Nang' },
  { code: 'QNG', name: 'Quang Ngai', city: 'Quang Ngai' },
  { code: 'NTR', name: 'Nha Trang', city: 'Khanh Hoa' },
  { code: 'HCM', name: 'TP Ho Chi Minh', city: 'TPHCM' },
  { code: 'BH', name: 'Bien Hoa', city: 'Dong Nai' }
];

const trains = [
  { trainCode: 'SE1', trainName: 'SE1', trainType: 'Tau nhanh', fromStationCode: 'HN', toStationCode: 'DAD', departureTime: '06:00', arrivalTime: '20:30', durationText: '14h 30m', rating: 4.8, isPremium: false },
  { trainCode: 'SE3', trainName: 'SE3', trainType: 'Tau nhanh', fromStationCode: 'HN', toStationCode: 'DAD', departureTime: '19:30', arrivalTime: '10:00', durationText: '14h 30m', rating: 4.7, isPremium: false },
  { trainCode: 'SE5', trainName: 'SE5', trainType: 'Tau chat luong cao', fromStationCode: 'HN', toStationCode: 'DAD', departureTime: '07:00', arrivalTime: '20:15', durationText: '13h 15m', rating: 4.9, isPremium: true },
  { trainCode: 'SE7', trainName: 'SE7', trainType: 'Tau thuong', fromStationCode: 'HN', toStationCode: 'DAD', departureTime: '22:00', arrivalTime: '13:30', durationText: '15h 30m', rating: 4.5, isPremium: false }
];

const carriageTemplates = [
  { carriageCode: 'NM1', carriageType: 'Ngoi mem dieu hoa', seatCount: 16, basePrice: 520000, classType: 'seat' },
  { carriageCode: 'K6', carriageType: 'Nam khoang 6', seatCount: 12, basePrice: 680000, classType: 'berth6' },
  { carriageCode: 'K4', carriageType: 'Nam khoang 4', seatCount: 8, basePrice: 820000, classType: 'berth4' }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    Station.deleteMany({}),
    Train.deleteMany({}),
    Owner.deleteMany({}),
    Carriage.deleteMany({}),
    Seat.deleteMany({}),
    Promotion.deleteMany({})
  ]);

  await Station.insertMany(stations);
  const owners = [
    { name: 'Công ty Vận tải Bắc Nam', contactName: 'Nguyễn Văn Chủ', phone: '0912345678', email: 'info@vettau.vn', type: 'company' },
    { name: 'Người bán lẻ A', contactName: 'Trần Thị B', phone: '0987654321', email: 'ownerA@example.com', type: 'individual' }
  ];
  const insertedOwners = await Owner.insertMany(owners);
  const insertedTrains = await Train.insertMany(trains);

  // Assign owners to some trains
  if (insertedOwners && insertedOwners.length) {
    await Train.findOneAndUpdate({ trainCode: 'SE1' }, { ownerId: insertedOwners[0]._id, ownerSnapshot: { name: insertedOwners[0].name, contactName: insertedOwners[0].contactName, phone: insertedOwners[0].phone, email: insertedOwners[0].email } });
    await Train.findOneAndUpdate({ trainCode: 'SE5' }, { ownerId: insertedOwners[1]._id, ownerSnapshot: { name: insertedOwners[1].name, contactName: insertedOwners[1].contactName, phone: insertedOwners[1].phone, email: insertedOwners[1].email } });
  }

  for (const train of insertedTrains) {
    for (const c of carriageTemplates) {
      const carriage = await Carriage.create({
        trainId: train._id,
        carriageCode: c.carriageCode,
        carriageType: c.carriageType,
        seatCount: c.seatCount,
        basePrice: c.basePrice
      });

      for (let i = 1; i <= c.seatCount; i += 1) {
        await Seat.create({
          trainId: train._id,
          carriageId: carriage._id,
          seatNumber: `${carriage.carriageCode}-${i}`,
          classType: c.classType,
          basePrice: c.basePrice,
          status: 'available'
        });
      }
    }
  }

  await Promotion.insertMany([
    {
      code: 'SAVE20',
      type: 'percent',
      value: 20,
      minOrderValue: 500000,
      maxDiscount: 200000,
      startAt: new Date('2026-01-01'),
      endAt: new Date('2027-12-31'),
      usageLimit: 0,
      usedCount: 0,
      isActive: true
    }
  ]);

  console.log('Seed thanh cong');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
