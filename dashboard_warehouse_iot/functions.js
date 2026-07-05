
function updateClock() {
  const now = new Date();
  let h = now.getHours(),
    m = now.getMinutes(),
    s = now.getSeconds();
  h = h < 10 ? "0" + h : h;
  m = m < 10 ? "0" + m : m;
  s = s < 10 ? "0" + s : s;
  document.getElementById("hours").innerText = h;
  document.getElementById("minutes").innerText = m;
  document.getElementById("seconds").innerText = s;
  document.getElementById("current-date").innerText = now.toLocaleDateString(
    "vi-VN",
    { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" },
  );
}
setInterval(updateClock, 1000);
updateClock();

Chart.register(ChartDataLabels);

const ctx = document.getElementById("mainChart").getContext("2d");
let thoiGianBieuDo = [
  "08:10",
  "08:12",
  "08:14",
  "08:16",
  "08:18",
  "08:20",
  "Hiện tại",
];
const mainChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [...thoiGianBieuDo],
    datasets: [
      {
        label: "Nhiệt độ",
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#3282b8",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
      },
      {
        label: "Ngưỡng cháy",
        data: [100, 100, 100, 100, 100, 100, 100],
        borderColor: "#e74c3c",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: (context) => context.datasetIndex === 0,
        color: "#3282b8",
        align: "top",
        anchor: "end",
        offset: 4,
        font: { weight: "bold", size: 11 },
        formatter: (value) => value + "°C",
      },
    },
    scales: {
      y: { min: -10, max: 120, grid: { color: "#30363d" } },
      x: { grid: { color: "#30363d" } },
    },
  },
});


var firebaseConfig = {
  apiKey: "AIzaSyBWz2lNJJVtaTXhazQiFOapDQTTiVbIbP4",
  authDomain: "dht11-127b3.firebaseapp.com",
  databaseURL: "https://dht11-127b3-107a5-default-rtdb.firebaseio.com",
  projectId: "dht11-127b3",
  storageBucket: "dht11-127b3.appspot.com",
  messagingSenderId: "1001817982577",
  appId: "1:1001817982577:web:81cd365b4ef0de76557dd0",
};
firebase.initializeApp(firebaseConfig);

var dbRefNhietDo, dbRefSoLuong, dbRefLapDay, dbRefDen, dbRefQuat, dbRefBom;
var nhietDoHienTai = 0;

// Ngưỡng nhiệt độ
const NGUONG_CANH_BAO = 50; 
const NGUONG_CHAY = 100; 

const warehouseSelect = document.getElementById("warehouse-select");


const labelFan = document.getElementById("label-fan");
const labelLight = document.getElementById("label-light");
const sliderQuat = document.getElementById("slider-quat");
const switchLight = document.getElementById("switch-light");
const btnOn = document.getElementById("btn-pump-on");
const btnOff = document.getElementById("btn-pump-off");

const lichSuMau = {
  khoA: [26, 27, 28, 27, 28, 29, 28],
  khoB: [33, 34, 35, 34, 33, 34, 34],
  khoC: [23, 24, 25, 24, 25, 26, 25],
};


let dangDongBoTuFirebase = false;

function chuyenKhoDuLieu(khoId) {
  if (dbRefNhietDo) dbRefNhietDo.off();
  if (dbRefSoLuong) dbRefSoLuong.off();
  if (dbRefLapDay) dbRefLapDay.off();
  if (dbRefDen) dbRefDen.off();
  if (dbRefQuat) dbRefQuat.off();
  if (dbRefBom) dbRefBom.off();

  mainChart.data.datasets[0].data = [...lichSuMau[khoId]];
  mainChart.update();

  dbRefNhietDo = firebase.database().ref().child(khoId).child("Nhiet do");
  dbRefSoLuong = firebase.database().ref().child(khoId).child("So luong hang");
  dbRefLapDay = firebase.database().ref().child(khoId).child("Ty le lap day");
  dbRefDen = firebase.database().ref().child(khoId).child("Den");
  dbRefQuat = firebase.database().ref().child(khoId).child("Quat");
  dbRefBom = firebase.database().ref().child(khoId).child("Bom chua chay");

  dbRefNhietDo.on("value", (snap) => {
    if (snap.val() !== null) {
      let tempValue = Number(snap.val());
      nhietDoHienTai = tempValue;
      document.getElementById("nhietdo").innerText = tempValue + "°C";

      const now = new Date();
      mainChart.data.datasets[0].data.push(tempValue);
      mainChart.data.datasets[0].data.shift();
      mainChart.data.labels.push(
        `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`,
      );
      mainChart.data.labels.shift();
      mainChart.update();

      const baochayEl = document.getElementById("baochay");
      const panelFire = document.getElementById("panel-fire");

  
      if (tempValue >= NGUONG_CHAY) {
      
        baochayEl.innerText = "KHẨN CẤP - BÁO CHÁY!";
        baochayEl.style.color = "#ffffff";
        panelFire.classList.remove("warning-active");
        panelFire.classList.add("fire-active");
        if (!isPumpOn) turnPumpOn(khoId);
      } else if (tempValue >= NGUONG_CANH_BAO) {
       
        baochayEl.innerText = "CẢNH BÁO NHIỆT ĐỘ CAO";
        baochayEl.style.color = "var(--neon-orange)";
        panelFire.classList.remove("fire-active");
        panelFire.classList.add("warning-active");
      } else {
    
        baochayEl.innerText = "An toàn";
        baochayEl.style.color = "var(--neon-green)";
        panelFire.classList.remove("fire-active", "warning-active");
      }
    }
  });

  dbRefSoLuong.on("value", (snap) => {
    if (snap.val() !== null)
      document.getElementById("soluong").innerText = snap.val();
  });
  dbRefLapDay.on("value", (snap) => {
    if (snap.val() !== null) {
      let val = snap.val();

    
      document.getElementById("lapday-vongtron").innerText = val + "%";
      document.querySelector(".progress-ring").style.background =
        `conic-gradient(#3282b8 0% ${val}%, #2c3238 ${val}% 100%)`;
    }
  });


  dbRefDen.on("value", (snap) => {
    if (snap.val() !== null) {
      let val = Number(snap.val());
      dangDongBoTuFirebase = true;
      switchLight.checked = val === 1;
      if (val === 1) labelLight.classList.add("device-active");
      else labelLight.classList.remove("device-active");
      dangDongBoTuFirebase = false;
    }
  });


  dbRefQuat.on("value", (snap) => {
    if (snap.val() !== null) {
      let val = Number(snap.val());
      dangDongBoTuFirebase = true;
      sliderQuat.value = val;
      document.getElementById("quat-val").innerText = val;
      if (val > 0) labelFan.classList.add("device-active");
      else labelFan.classList.remove("device-active");
      dangDongBoTuFirebase = false;
    }
  });


  dbRefBom.on("value", (snap) => {
    if (snap.val() !== null) {
      let val = Number(snap.val());
      if (val === 1 && !isPumpOn) {
        isPumpOn = true;
        btnOn.classList.add("active");
        btnOff.classList.remove("active");
      } else if (val === 0 && isPumpOn) {
        isPumpOn = false;
        btnOff.classList.add("active");
        btnOn.classList.remove("active");
      }
    }
  });
}

warehouseSelect.addEventListener("change", function () {
  chuyenKhoDuLieu(this.value);
});
chuyenKhoDuLieu(warehouseSelect.value);

sliderQuat.addEventListener("input", function () {
  document.getElementById("quat-val").innerText = this.value;
});

sliderQuat.addEventListener("change", function () {
  if (dangDongBoTuFirebase) return; 

  let speed = Number(this.value);


  if (speed > 0) labelFan.classList.add("device-active");
  else labelFan.classList.remove("device-active");

  firebase
    .database()
    .ref()
    .child(warehouseSelect.value)
    .child("Quat")
    .set(speed);


  if (speed > 0) {
    firebase
      .database()
      .ref()
      .child(warehouseSelect.value)
      .child("Nhiet do")
      .set(Number(nhietDoHienTai) - 3);
  } else {
    firebase
      .database()
      .ref()
      .child(warehouseSelect.value)
      .child("Nhiet do")
      .set(Number(nhietDoHienTai) + 3);
  }
});


labelFan.addEventListener("click", function () {
  let currentSpeed = Number(sliderQuat.value);
  if (currentSpeed === 0) sliderQuat.value = 100;
  else sliderQuat.value = 0;
  sliderQuat.dispatchEvent(new Event("input"));
  sliderQuat.dispatchEvent(new Event("change"));
});


switchLight.addEventListener("change", function () {
  if (dangDongBoTuFirebase) return; 

  let isChecked = this.checked;


  if (isChecked) labelLight.classList.add("device-active");
  else labelLight.classList.remove("device-active");

  firebase
    .database()
    .ref()
    .child(warehouseSelect.value)
    .child("Den")
    .set(isChecked ? 1 : 0);
});


labelLight.addEventListener("click", function () {
  switchLight.checked = !switchLight.checked;
  switchLight.dispatchEvent(new Event("change"));
});


let nhietDoLuuTru = 0;
let chuKyPhucHoi = null;
let isPumpOn = false;

function turnPumpOn(khoId) {
  if (isPumpOn) return;
  isPumpOn = true;
  btnOn.classList.add("active");
  btnOff.classList.remove("active");
  firebase.database().ref().child(khoId).child("Bom chua chay").set(1);

  if (chuKyPhucHoi) clearInterval(chuKyPhucHoi);
  if (Number(nhietDoHienTai) > 0) nhietDoLuuTru = Number(nhietDoHienTai);

  firebase.database().ref().child(khoId).child("Nhiet do").set(0);
}

function turnPumpOff(khoId) {
  if (!isPumpOn) return;
  isPumpOn = false;
  btnOff.classList.add("active");
  btnOn.classList.remove("active");
  firebase.database().ref().child(khoId).child("Bom chua chay").set(0);


  chuKyPhucHoi = setInterval(() => {
    let nhietDoMoi = Number(nhietDoHienTai) + 5;
    if (nhietDoMoi >= nhietDoLuuTru) {
      nhietDoMoi = nhietDoLuuTru;
      clearInterval(chuKyPhucHoi);
    }
    firebase
      .database()
      .ref()
      .child(khoId)
      .child("Nhiet do")
      .set(nhietDoMoi);
  }, 1000);
}

btnOn.addEventListener("click", () => turnPumpOn(warehouseSelect.value));
btnOff.addEventListener("click", () => turnPumpOff(warehouseSelect.value));


const themeToggleBtn = document.getElementById("theme-toggle");
themeToggleBtn.addEventListener("click", function () {
  document.body.classList.toggle("light-theme");
  let isLight = document.body.classList.contains("light-theme");
  this.querySelector("i").className = isLight
    ? "fa-solid fa-moon"
    : "fa-solid fa-sun";
  mainChart.options.scales.x.grid.color = isLight ? "#e0e6ed" : "#30363d";
  mainChart.options.scales.y.grid.color = isLight ? "#e0e6ed" : "#30363d";
  mainChart.update();
});

const videoElement = document.getElementById('webcam-feed');
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) { 
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
                  videoElement.srcObject = stream;
        })
        .catch(function(error) {
            console.log("Không thể mở Camera: ", error);
            alert("Vui lòng cấp quyền sử dụng Camera cho trình duyệt để xem luồng Video!");
        });
} else {
    console.log("Trình duyệt của bạn không hỗ trợ tính năng Camera.");
}