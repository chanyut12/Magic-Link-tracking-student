<template>
  <q-page class="bg-grey-1 q-pa-md font-sans text-slate-700 min-h-screen">
    <div class="row justify-center">
      <div class="col-12" style="max-width: 1000px">

        <!-- Student Profile Header -->
        <q-card class="soft-shadow border-gray-100 q-mb-lg profile-card" style="border-radius: 24px;">
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-col-gutter-lg">
              <!-- Avatar -->
              <div class="col-12 col-md-auto text-center">
                <q-avatar size="110px" class="bg-grey-3 shadow-2">
                  <img src="https://lh3.googleusercontent.com/aida/ADBb0uiqLGxk_ShoS6lmvnXck8xeK-rEC5XpZGtD5n2Gv7xwnjbmhqHTuxxA43BM2KluZRQoFQulUzT08KtQMuSawkV0AJTQECPFFXA809k924NF0DIt3laWlQo4jTEBjKgrCSvQ5dXiEfvmpdsIH5rqfiSZ1nks3qCdZ4JdaPXGxRSHpyAlv0dnMlrTSMlhRSz7rHxCxAR5DZzpSh-kiYr6VFqJ5sou4y2WN0ePCseQC986427ShZrNioQbz290ZklNpQZC2NAwdFVRIQ" alt="Student Avatar" />
                </q-avatar>
              </div>

              <!-- Student Info -->
              <div class="col-12 col-md">
                <div class="row justify-between items-start">
                  <div class="col-12 col-sm-8 text-center text-md-left">
                    <h1 class="text-h5 text-weight-bold text-slate-800 q-my-none">กิตติพิสุทธิ์ จันทร์ศรี</h1>
                    <div class="row q-col-gutter-x-md q-mt-sm text-slate-500 text-body2 justify-center justify-md-start">
                      <div>ID: <span class="text-slate-800 text-weight-medium">6401023</span></div>
                      <div>เลขบัตรประชาชน: <span class="text-slate-800 text-weight-medium">1-xxxx-xxxxx-xx-x</span></div>
                      <div>โทรผู้ปกครอง: <span class="text-slate-800 text-weight-medium">099-999-9999</span></div>
                    </div>
                  </div>

                  <div class="col-12 col-sm-4 text-center text-md-right q-mt-md q-sm-mt-none row justify-end items-center q-gutter-sm">
                    <q-btn
                      unelevated
                      rounded
                      color="primary"
                      class="bg-blue-1 text-primary text-weight-bold q-px-md"
                      label="ประเมิน SDQ"
                    />
                    <q-btn flat round class="bg-grey-2 text-grey-7" size="sm" icon="drive_file_rename_outline" />
                    <q-btn flat round class="bg-grey-2 text-grey-7" size="sm" icon="more_vert" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-sm rounded-borders inner-card-shadow">
                  <div class="text-caption text-slate-500 text-weight-medium">C.Register</div>
                  <div class="text-subtitle1 text-weight-bold text-slate-800">108</div>
                </q-card>
              </div>
              <div class="col-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-sm rounded-borders inner-card-shadow">
                  <div class="text-caption text-slate-500 text-weight-medium">C.Earn</div>
                  <div class="text-subtitle1 text-weight-bold text-slate-800">89</div>
                </q-card>
              </div>
              <div class="col-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-sm rounded-borders inner-card-shadow">
                  <div class="text-caption text-slate-500 text-weight-medium">GPA</div>
                  <div class="text-subtitle1 text-weight-bold text-slate-800">2.79</div>
                </q-card>
              </div>
              <div class="col-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-sm rounded-borders inner-card-shadow">
                  <div class="text-caption text-slate-500 text-weight-medium">GPAX</div>
                  <div class="text-subtitle1 text-weight-bold text-slate-800">2.50</div>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="row q-col-gutter-lg">
          <!-- Left Column -->
          <div class="col-12 col-md-6 column q-gutter-y-lg">

            <!-- Tracking History -->
            <q-card class="soft-shadow border-gray-100 col" style="border-radius: 24px;">
              <q-card-section>
                <div class="text-h6 text-weight-bold text-slate-800 q-mb-md">ประวัติการติดตามนักเรียน</div>
                <q-list separator>
                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">24 ธันวาคม 2564</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">ดื่มสุราในโรงเรียน และมีเรื่องชกต่อย</q-item-label>
                      <q-item-label caption class="text-xs q-mt-xs">โดย: อาจารย์ ทิวลี่ ญาติเยอะ</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-chip outline color="negative" class="bg-red-1" dense size="sm" style="font-weight: bold;">
                        เสี่ยงสูง
                      </q-chip>
                    </q-item-section>
                  </q-item>

                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">16 ธันวาคม 2564</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">สูบบุหรี่ในห้องน้ำโรงเรียนกับกลุ่มเพื่อน</q-item-label>
                      <q-item-label caption class="text-xs q-mt-xs">โดย: อาจารย์ ทิวลี่ ญาติเยอะ</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-chip outline color="warning" text-color="orange-9" class="bg-orange-1" dense size="sm" style="font-weight: bold;">
                        เฝ้าระวัง
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div class="text-right q-mt-sm">
                  <q-btn flat color="grey-7" label="เพิ่มเติม" size="sm" class="underline font-medium" />
                </div>
              </q-card-section>
            </q-card>

            <!-- Home Visit History -->
            <q-card class="soft-shadow border-gray-100 col" style="border-radius: 24px;">
              <q-card-section>
                <div class="text-h6 text-weight-bold text-slate-800 q-mb-md">ประวัติการเยี่ยมบ้าน</div>
                <q-list separator>
                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">14 ธันวาคม 2564</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">นักเรียนอยู่ในกลุ่มมั่วสุม</q-item-label>
                      <q-item-label caption class="text-xs q-mt-xs">โดย: อาจารย์ ทิวลี่ ญาติเยอะ</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">16 พฤศจิกายน 2564</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">นักเรียนมีพฤติกรรมก้าวร้าว</q-item-label>
                      <q-item-label caption class="text-xs q-mt-xs">โดย: อาจารย์ ทิวลี่ ญาติเยอะ</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div class="text-right q-mt-sm">
                  <q-btn flat color="grey-7" label="เพิ่มเติม" size="sm" class="underline font-medium" />
                </div>
              </q-card-section>
            </q-card>

          </div>

          <!-- Right Column: Attendance History -->
          <div class="col-12 col-md-6">
            <q-card class="soft-shadow border-gray-100 full-height" style="border-radius: 24px;">
              <q-card-section>
                <div class="text-h6 text-weight-bold text-slate-800 q-mb-md">ประวัติการเข้าเรียน</div>

                <q-card flat bordered class="rounded-borders q-pa-md inner-card-shadow bg-white q-mb-md">
                  <!-- Calendar Header -->
                  <div class="row justify-between items-center q-mb-md">
                    <div class="row items-center q-gutter-sm text-slate-700">
                      <q-icon name="calendar_today" size="sm" color="grey-7" />
                      <span class="text-weight-bold">ธันวาคม 2564</span>
                    </div>
                    <div>
                      <q-btn flat dense round icon="chevron_left" color="grey-6" />
                      <q-btn flat dense round icon="chevron_right" color="grey-6" />
                    </div>
                  </div>

                  <!-- Calendar Grid -->
                  <div class="calendar-grid text-caption text-weight-bold text-slate-400 text-center q-mb-sm">
                    <div>จ.</div><div>อ.</div><div>พ.</div><div>พฤ.</div><div>ศ.</div><div>ส.</div><div>อา.</div>
                  </div>
                  <div class="calendar-grid text-caption text-center q-col-gutter-y-md">
                    <div class="text-positive text-weight-bold">1</div>
                    <div class="text-negative text-weight-bold">2</div>
                    <div class="text-warning text-weight-bold">3</div>
                    <div class="text-positive text-weight-bold">4</div>
                    <div class="text-positive text-weight-bold">5</div>
                    <div class="text-weight-medium">6</div>
                    <div class="text-weight-medium">7</div>

                    <div class="text-warning text-weight-bold">8</div>
                    <div class="text-positive text-weight-bold">9</div>
                    <div class="text-positive text-weight-bold">10</div>
                    <div class="text-negative text-weight-bold">11</div>
                    <div class="text-warning text-weight-bold">12</div>
                    <div class="text-weight-medium">13</div>
                    <div class="text-weight-medium">14</div>

                    <div class="text-positive text-weight-bold">15</div>
                    <div class="text-positive text-weight-bold">16</div>
                    <div class="text-warning text-weight-bold">17</div>
                    <div class="text-positive text-weight-bold">18</div>
                    <div class="text-positive text-weight-bold">19</div>
                    <div class="text-weight-medium">20</div>
                    <div class="text-weight-medium">21</div>

                    <div class="text-positive text-weight-bold">22</div>
                    <div class="text-negative text-weight-bold">23</div>
                    <div class="text-positive text-weight-bold">24</div>
                    <div><span class="bg-grey-3 text-slate-800 text-weight-bold flex flex-center" style="border-radius: 50%; width: 24px; height: 24px; margin: 0 auto;">25</span></div>
                    <div class="text-weight-medium">26</div>
                    <div class="text-weight-medium">27</div>
                    <div class="text-weight-medium">28</div>

                    <div class="text-weight-medium">29</div>
                    <div class="text-weight-medium">30</div>
                    <div class="text-weight-medium">31</div>
                    <div></div><div></div><div></div><div></div>
                  </div>

                  <!-- Legend -->
                  <div class="row justify-center q-gutter-x-md q-mt-lg text-xs text-slate-500 text-weight-medium">
                    <div class="row items-center q-gutter-x-xs">
                      <div class="color-dot bg-positive"></div> <span>เข้าเรียนครบ</span>
                    </div>
                    <div class="row items-center q-gutter-x-xs">
                      <div class="color-dot bg-warning"></div> <span>เข้าบางส่วน</span>
                    </div>
                    <div class="row items-center q-gutter-x-xs">
                      <div class="color-dot bg-negative"></div> <span>ไม่เข้าเรียน</span>
                    </div>
                  </div>
                </q-card>

                <!-- Daily Detail List -->
                <q-list separator>
                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">08:34:12 น.</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 q-mt-xs text-body2">วิชา: สังคมศึกษา</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip outline color="warning" text-color="orange-9" class="bg-orange-1" dense size="sm" style="font-weight: bold;">
                        สาย
                      </q-chip>
                    </q-item-section>
                  </q-item>

                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">10:02:47 น.</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 q-mt-xs text-body2">วิชา: คณิตศาสตร์</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip outline color="positive" class="bg-green-1" dense size="sm" style="font-weight: bold;">
                        ตรงเวลา
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </q-list>

              </q-card-section>
            </q-card>
          </div>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// Student Information Component Logic
</script>

<style scoped>
/* Keeping exact smooth shadows to preserve the visual identity */
.soft-shadow {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}
.inner-card-shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.text-xs {
  font-size: 0.75rem;
}
</style>
