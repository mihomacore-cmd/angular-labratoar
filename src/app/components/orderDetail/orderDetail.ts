import {
  Component,
  OnInit,
  inject,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AttachmentService } from '../../servicies/attachmentService/attachmentService';

import {
  KanbanService,
  OrderDetailResponse
} from '../../servicies/kenbanService/kenban.service';

import {
  Jalali,
  JalaliDate
} from '../../components/persianCalender/jalali';

import {
  PersianCalendarComponent
} from '../../components/persianCalender/persianCalender';

import {
  AddOrderService
} from '../../servicies/addOrder.service';


// ============================================================
// Attachment
// ============================================================

interface Attachment {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileObject?: File;
  viewUrl?: string;
  downloadUrl?: string;
}


// ============================================================
// Clinic
// ============================================================

export interface Clinic {
  id: number;
  name: string;
}


// ============================================================
// ClinicDoctor
// ============================================================

export interface ClinicDoctor {
  id: number;
  doctorId: number;
  doctorName: string;
  phone: string;
}


// ============================================================
// Component
// ============================================================

@Component({
  selector: 'order-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PersianCalendarComponent
  ],
  templateUrl: './orderDetail.html',
  styleUrls: ['./orderDetail.scss']
})
export class OrderDetailsComponent implements OnInit {

  private readonly kanbanService = inject(KanbanService);
  private readonly orderService = inject(AddOrderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly attachmentService = inject(AttachmentService);


  // ============================================================
  // Inputs / Outputs
  // ============================================================

  @Input() orderId: number | null = null;

  @Input() disableEdit = false;

  @Output() closed = new EventEmitter<void>();


  // ============================================================
  // Loading / Error
  // ============================================================

  loading = false;

  errorMessage = '';


  // ============================================================
  // Edit mode
  // ============================================================

  isEditMode = false;


  // ============================================================
  // Clinics / Doctors
  // ============================================================

  clinics: Clinic[] = [];

  doctors: ClinicDoctor[] = [];

  selectedClinicId: number | null = null;

  selectedDoctorId: number | null = null;


  // ============================================================
  // Order info
  // ============================================================

  orderInfo = {

    // =========================
    // اطلاعات اصلی
    // =========================

    clinicId: null as number | null,

    clinicName: '',

    clinicDoctorId: null as number | null,

    doctorName: '',

    patientName: '',

    /*
     * مهم:
     *
     * phoneNumber فقط از ClinicDoctor
     * دریافت می‌شود و در UI قابل ویرایش نیست.
     */
    phoneNumber: '',


    // =========================
    // وضعیت سفارش
    // =========================

    orderStatus: '',


    // =========================
    // فاکتور
    // =========================

    invoiceType: 'DAILY',

    invoiceNumber: '',


    // =========================
    // تاریخ
    // =========================

    entryDate: '',

    exitDate: '',


    // =========================
    // اطلاعات مالی
    // =========================

    discountAmount: 0,

    grossTotal: 0,

    netTotal: 0,

    initialPaymentPercent: null as number | null,

    initialPaymentAmount: 0,

    initialPaidAmount: 0,

    finalPaymentAmount: 0,

    finalPaidAmount: 0,

    paidAmount: 0,

    remainingAmount: 0,

    settled: false,

    paymentStatus: '',


    // =========================
    // فایل‌ها
    // =========================

    attachments: [] as Attachment[]
  };


  // ============================================================
  // Items
  // ============================================================

  items: any[] = [];


  // ============================================================
  // Calendar
  // ============================================================

  showEntryDatePicker = false;

  showExitDatePicker = false;

  exitDateInvalid = false;


  // ============================================================
  // Validation modal
  // ============================================================

  showValidationModal = false;

  validationErrorMessage = '';


  // ============================================================
  // Success modal
  // ============================================================

  showSuccessModal = false;

  successMessage = '';


  // ============================================================
  // Deleted attachments
  // ============================================================

  private deletedAttachmentIds: number[] = [];


  // ============================================================
  // Entry date for minDate
  // ============================================================

  get entryDateValue(): JalaliDate | undefined {

    const value = this.orderInfo.entryDate;

    if (!value) {
      return undefined;
    }

    const parts = value
      .split('/')
      .map(Number);

    if (
      parts.length === 3 &&
      parts.every(part => !isNaN(part))
    ) {

      return {
        year: parts[0],
        month: parts[1],
        day: parts[2]
      };
    }

    return undefined;
  }


  // ============================================================
  // Init
  // ============================================================

  ngOnInit(): void {

    this.loadClinics();

    if (!this.orderId) {

      this.errorMessage =
        'شناسه سفارش معتبر نیست.';

      setTimeout(() => {
        this.closeDialog();
      }, 1500);

      return;
    }

    this.loadOrderDetail(this.orderId);
  }


  // ============================================================
  // Load clinics
  // ============================================================

  private loadClinics(): void {

    this.orderService
      .getClinics()
      .subscribe({

        next: (clinics) => {

          this.clinics = clinics;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            '❌ خطا در دریافت کلینیک‌ها:',
            error
          );

          this.errorMessage =
            'دریافت لیست کلینیک‌ها با خطا مواجه شد.';

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Load doctors by clinic
  // ============================================================

  private loadDoctorsByClinic(
    clinicId: number,
    selectedClinicDoctorId: number | null = null
  ): void {

    this.doctors = [];

    this.orderService
      .getDoctorsByClinic(clinicId)
      .subscribe({

        next: (doctors) => {

          this.doctors = doctors;

          if (selectedClinicDoctorId !== null) {

            const selectedDoctor =
              this.doctors.find(
                doctor =>
                  Number(doctor.id) ===
                  Number(selectedClinicDoctorId)
              );

            if (selectedDoctor) {

              this.selectedDoctorId =
                selectedDoctor.id;

              /*
               * شماره تلفن همیشه از رکورد ClinicDoctor
               * گرفته می‌شود.
               */
              this.orderInfo.phoneNumber =
                selectedDoctor.phone || '';

              this.orderInfo.doctorName =
                selectedDoctor.doctorName || '';
            }
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            '❌ خطا در دریافت پزشکان:',
            error
          );

          this.doctors = [];

          this.errorMessage =
            'دریافت پزشکان کلینیک با خطا مواجه شد.';

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Load order detail
  // ============================================================

  loadOrderDetail(orderId: number): void {

    this.loading = true;

    this.errorMessage = '';

    this.deletedAttachmentIds = [];

    this.kanbanService
      .getOrderById(orderId)
      .subscribe({

        next: (data: OrderDetailResponse) => {

          console.log(
            '📦 داده سفارش:',
            data
          );


          // ====================================================
          // Invoice type
          // ====================================================

          let invoiceTypeKey = 'DAILY';

          if (
            data.invoiceType === 'ماهانه' ||
            data.invoiceType === 'MONTHLY' ||
            data.invoiceType === 'monthly'
          ) {

            invoiceTypeKey = 'MONTHLY';

          } else if (
            data.invoiceType === 'روزانه' ||
            data.invoiceType === 'DAILY' ||
            data.invoiceType === 'daily'
          ) {

            invoiceTypeKey = 'DAILY';
          }


          // ====================================================
          // Dates
          // ====================================================

          const entryDate =
            data.entryDate
              ? this.convertToJalali(data.entryDate)
              : '';

          const exitDate =
            data.exitDate
              ? this.convertToJalali(data.exitDate)
              : '';


          // ====================================================
          // Order info
          // ====================================================

          this.orderInfo = {

            clinicId:
              data.clinicId ?? null,

            clinicName:
              data.clinicName || '',

            clinicDoctorId:
              data.clinicDoctorId ?? null,

            doctorName:
              data.doctorName || '',

            patientName:
              data.patientName || '',

            phoneNumber:
              data.phoneNumber || '',

            orderStatus:
              data.orderStatus || '',

            invoiceType:
              invoiceTypeKey,

            invoiceNumber:
              data.invoiceNumber || '',

            entryDate,

            exitDate,

            discountAmount:
              data.discountAmount ?? 0,

            grossTotal:
              data.grossTotal ?? 0,

            netTotal:
              data.netTotal ?? 0,

            initialPaymentPercent:
              data.initialPaymentPercent ?? null,

            initialPaymentAmount:
              data.initialPaymentAmount ?? 0,

            initialPaidAmount:
              data.initialPaidAmount ?? 0,

            finalPaymentAmount:
              data.finalPaymentAmount ?? 0,

            finalPaidAmount:
              data.finalPaidAmount ?? 0,

            paidAmount:
              data.paidAmount ?? 0,

            remainingAmount:
              data.remainingAmount ?? 0,

            settled:
              data.settled ?? false,

            paymentStatus:
              data.paymentStatus || '',

            attachments:
              (data.attachments || []).map(att => ({
                id: att.id,
                fileName: att.fileName,
                fileType: att.fileType,
                fileSize: att.fileSize,
                viewUrl: att.viewUrl,
                downloadUrl: att.downloadUrl
              }))
          };


          // ====================================================
          // Selected clinic
          // ====================================================

          this.selectedClinicId =
            this.orderInfo.clinicId;


          // ====================================================
          // Selected doctor
          // ====================================================

          this.selectedDoctorId =
            this.orderInfo.clinicDoctorId;


          // ====================================================
          // Load doctors
          // ====================================================

          if (this.selectedClinicId) {

            this.loadDoctorsByClinic(
              this.selectedClinicId,
              this.selectedDoctorId
            );
          }


          // ====================================================
          // Items
          // ====================================================

          this.items =
            (data.items || []).map(item => ({

              serviceType:
                item.serviceType || '',

              toothNumber:
                item.toothNumber || '',

              quantity:
                item.quantity || 1,

              unitPrice:
                item.unitPrice || 0,

              totalPrice:
                item.totalPrice || 0
            }));


          // ====================================================
          // Validate dates
          // ====================================================

          this.validateExitDate();

          this.loading = false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            '❌ خطا در دریافت جزئیات سفارش:',
            error
          );

          this.errorMessage =
            'خطا در دریافت اطلاعات سفارش. لطفاً مجدداً تلاش کنید.';

          this.loading = false;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Clinic changed
  // ============================================================

  onClinicChange(
    clinicId: number | string | null
  ): void {

    const id =
      clinicId !== null &&
      clinicId !== ''
        ? Number(clinicId)
        : null;


    this.selectedClinicId = id;


    // ==========================================================
    // بروزرسانی کلینیک
    // ==========================================================

    this.orderInfo.clinicId = id;

    this.orderInfo.clinicName =
      this.clinics.find(
        clinic => clinic.id === id
      )?.name || '';


    // ==========================================================
    // پزشک قبلی دیگر معتبر نیست
    // ==========================================================

    this.selectedDoctorId = null;

    this.orderInfo.clinicDoctorId = null;

    this.orderInfo.doctorName = '';

    /*
     * شماره تلفن پزشک قبلی هم باید پاک شود.
     * شماره جدید بعد از انتخاب پزشک پر می‌شود.
     */
    this.orderInfo.phoneNumber = '';

    this.doctors = [];


    if (!id) {
      return;
    }


    this.loadDoctorsByClinic(id);
  }


  // ============================================================
  // Doctor changed
  // ============================================================

  onDoctorChange(
    clinicDoctorId: number | string | null
  ): void {

    const id =
      clinicDoctorId !== null &&
      clinicDoctorId !== ''
        ? Number(clinicDoctorId)
        : null;


    this.selectedDoctorId = id;

    this.orderInfo.clinicDoctorId = id;


    // ==========================================================
    // هیچ پزشکی انتخاب نشده
    // ==========================================================

    if (!id) {

      this.orderInfo.doctorName = '';

      this.orderInfo.phoneNumber = '';

      return;
    }


    // ==========================================================
    // پیدا کردن ClinicDoctor
    // ==========================================================

    const selectedDoctor =
      this.doctors.find(
        doctor =>
          Number(doctor.id) === id
      );


    if (!selectedDoctor) {

      this.orderInfo.doctorName = '';

      this.orderInfo.phoneNumber = '';

      return;
    }


    // ==========================================================
    // نام پزشک
    // ==========================================================

    this.orderInfo.doctorName =
      selectedDoctor.doctorName || '';


    // ==========================================================
    // شماره تلفن پزشک
    // ==========================================================

    this.orderInfo.phoneNumber =
      selectedDoctor.phone || '';
  }


  // ============================================================
  // Edit mode
  // ============================================================

  toggleEditMode(): void {

    // ==========================================================
    // ورود به حالت ویرایش
    // ==========================================================

    if (!this.isEditMode) {

      this.selectedClinicId =
        this.orderInfo.clinicId;

      this.selectedDoctorId =
        this.orderInfo.clinicDoctorId;

      this.isEditMode = true;


      if (this.selectedClinicId) {

        this.loadDoctorsByClinic(
          this.selectedClinicId,
          this.selectedDoctorId
        );
      }

      this.cdr.detectChanges();

      return;
    }


    // ==========================================================
    // لغو ویرایش
    // ==========================================================

    this.isEditMode = false;

    this.deletedAttachmentIds = [];

    this.showEntryDatePicker = false;

    this.showExitDatePicker = false;

    this.exitDateInvalid = false;

    this.showValidationModal = false;

    this.validationErrorMessage = '';


    /*
     * با لغو ویرایش، کل اطلاعات از Backend
     * دوباره دریافت می‌شود.
     */
    if (this.orderId) {

      this.loadOrderDetail(this.orderId);
    }
  }


  // ============================================================
  // Entry date
  // ============================================================

  toggleEntryDatePicker(): void {

    if (!this.isEditMode) {
      return;
    }

    this.showEntryDatePicker =
      !this.showEntryDatePicker;

    this.showExitDatePicker = false;
  }


  closeEntryDatePicker(): void {

    this.showEntryDatePicker = false;
  }


  onEntryDateConfirm(date: string): void {

    this.orderInfo.entryDate = date;

    this.closeEntryDatePicker();


    if (this.orderInfo.exitDate) {

      this.validateExitDate();


      if (this.exitDateInvalid) {

        this.orderInfo.exitDate = '';

        this.exitDateInvalid = false;

        this.validationErrorMessage =
          'تاریخ خروج با تغییر تاریخ ورود نامعتبر شد. لطفاً مجدداً انتخاب کنید.';

        this.showValidationModal = true;
      }
    }
  }


  // ============================================================
  // Exit date
  // ============================================================

  toggleExitDatePicker(): void {

    if (!this.isEditMode) {
      return;
    }

    this.showExitDatePicker =
      !this.showExitDatePicker;

    this.showEntryDatePicker = false;
  }


  closeExitDatePicker(): void {

    this.showExitDatePicker = false;
  }


  onExitDateConfirm(date: string): void {

    this.orderInfo.exitDate = date;

    this.closeExitDatePicker();

    this.validateExitDate();


    if (this.exitDateInvalid) {

      this.orderInfo.exitDate = '';

      this.validationErrorMessage =
        'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';

      this.showValidationModal = true;
    }
  }


  onInvalidExitDate(): void {

    this.validationErrorMessage =
      'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';

    this.showValidationModal = true;
  }


  // ============================================================
  // Validate exit date
  // ============================================================

  private validateExitDate(): void {

    const entry =
      this.orderInfo.entryDate;

    const exit =
      this.orderInfo.exitDate;


    if (!entry || !exit) {

      this.exitDateInvalid = false;

      return;
    }


    const entryParts =
      entry.split('/').map(Number);

    const exitParts =
      exit.split('/').map(Number);


    if (
      entryParts.length !== 3 ||
      exitParts.length !== 3
    ) {

      this.exitDateInvalid = false;

      return;
    }


    const entryObj: JalaliDate = {

      year: entryParts[0],

      month: entryParts[1],

      day: entryParts[2]
    };


    const exitObj: JalaliDate = {

      year: exitParts[0],

      month: exitParts[1],

      day: exitParts[2]
    };


    const entryGreg =
      Jalali.toGregorian(
        entryObj.year,
        entryObj.month,
        entryObj.day
      );


    const exitGreg =
      Jalali.toGregorian(
        exitObj.year,
        exitObj.month,
        exitObj.day
      );


    this.exitDateInvalid =
      exitGreg < entryGreg;
  }


  // ============================================================
  // Validation modal
  // ============================================================

  closeValidationModal(): void {

    this.showValidationModal = false;

    this.validationErrorMessage = '';
  }


  // ============================================================
  // Success modal
  // ============================================================

  closeSuccessModal(): void {

    this.showSuccessModal = false;

    this.successMessage = '';
  }


  // ============================================================
  // Items
  // ============================================================

  addItem(): void {

    if (!this.isEditMode) {
      return;
    }

    this.items.push({

      serviceType: '',

      toothNumber: '',

      quantity: 1,

      unitPrice: 0,

      totalPrice: 0
    });
  }


  removeItem(index: number): void {

    if (!this.isEditMode) {
      return;
    }


    if (this.items.length === 1) {

      this.items[0] = {

        serviceType: '',

        toothNumber: '',

        quantity: 1,

        unitPrice: 0,

        totalPrice: 0
      };

      return;
    }


    this.items.splice(index, 1);
  }


  rowTotal(index: number): number {

    const item = this.items[index];

    if (!item) {
      return 0;
    }

    return (
      Number(item.quantity || 0) *
      Number(item.unitPrice || 0)
    );
  }


  get totalAmount(): number {

    return this.items.reduce(

      (sum, item) =>

        sum +
        (
          Number(item.quantity || 0) *
          Number(item.unitPrice || 0)
        ),

      0
    );
  }


  get finalAmount(): number {

    return Math.max(

      this.totalAmount -
      Number(this.orderInfo.discountAmount || 0),

      0
    );
  }


formatMoney(value: number | null | undefined): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(amount);
}
  // ============================================================
  // مدیریت ورودی مبالغ (فقط ذخیره‌سازی عدد خام)
  // ============================================================

onMoneyInput(
  event: Event,
  field:
    | 'grossTotal'
    | 'discountAmount'
    | 'netTotal'
    | 'initialPaymentAmount'
    | 'initialPaidAmount'
    | 'finalPaymentAmount'
    | 'finalPaidAmount'
    | 'paidAmount'
    | 'remainingAmount'
): void {
  const input = event.target as HTMLInputElement;

  // فقط عددها
  const rawValue = input.value.replace(/[^\d]/g, '');

  if (!rawValue) {
    this.orderInfo[field] = 0;
    input.value = '';
    return;
  }

  const numericValue = Number(rawValue);

  this.orderInfo[field] = numericValue;

  // سه رقم سه رقم
  input.value = this.formatMoney(numericValue);
}


  // ============================================================
  // فرمت‌کردن مبلغ آیتم هنگام خروج از فیلد (blur)
  // ============================================================

 onMoneyBlur(
  event: Event,
  field:
    | 'grossTotal'
    | 'discountAmount'
    | 'netTotal'
    | 'initialPaymentAmount'
    | 'initialPaidAmount'
    | 'finalPaymentAmount'
    | 'finalPaidAmount'
    | 'paidAmount'
    | 'remainingAmount'
): void {
  const input = event.target as HTMLInputElement;

  input.value = this.formatMoney(this.orderInfo[field]);
}


  // ============================================================
  // Attachments
  // ============================================================

  onFileSelected(event: Event): void {

    if (!this.isEditMode) {
      return;
    }

    const input =
      event.target as HTMLInputElement;

    const files = input.files;

    if (!files) {
      return;
    }


    for (
      let i = 0;
      i < files.length;
      i++
    ) {

      const file = files[i];

      this.orderInfo.attachments.push({

        fileName: file.name,

        fileType: file.type,

        fileSize: file.size,

        fileObject: file
      });
    }


    input.value = '';
  }


  removeAttachment(index: number): void {

    if (!this.isEditMode) {
      return;
    }

    const attachment =
      this.orderInfo.attachments[index];


    if (attachment?.id) {

      this.deletedAttachmentIds.push(
        attachment.id
      );
    }


    this.orderInfo.attachments.splice(
      index,
      1
    );
  }


  // ============================================================
  // Submit
  // ============================================================

  submitOrder(): void {

    if (!this.isEditMode) {
      return;
    }


    // ==========================================================
    // Validate dates
    // ==========================================================

    this.validateExitDate();


    if (this.exitDateInvalid) {

      this.validationErrorMessage =
        'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';

      this.showValidationModal = true;

      return;
    }


    // ==========================================================
    // Validate clinic
    // ==========================================================

    if (!this.orderInfo.clinicId) {

      this.validationErrorMessage =
        'لطفاً کلینیک را انتخاب کنید.';

      this.showValidationModal = true;

      return;
    }


    // ==========================================================
    // Validate doctor
    // ==========================================================

    if (!this.orderInfo.clinicDoctorId) {

      this.validationErrorMessage =
        'لطفاً پزشک را انتخاب کنید.';

      this.showValidationModal = true;

      return;
    }


    // ==========================================================
    // پیدا کردن پزشک انتخاب‌شده
    // ==========================================================

    const selectedDoctor =
      this.doctors.find(
        doctor =>
          Number(doctor.id) ===
          Number(this.orderInfo.clinicDoctorId)
      );


    if (!selectedDoctor) {

      this.validationErrorMessage =
        'پزشک انتخاب‌شده در کلینیک پیدا نشد.';

      this.showValidationModal = true;

      return;
    }


    /*
     * بسیار مهم:
     *
     * شماره تلفن را از orderInfo که قابل ویرایش نیست
     * نمی‌گیریم؛ مستقیماً از ClinicDoctor می‌گیریم.
     *
     * بنابراین حتی اگر مقدار UI دستکاری شود،
     * Payload شماره اشتباه ارسال نمی‌کند.
     */
    const doctorPhone =
      selectedDoctor.phone || '';


    // ==========================================================
    // Dates
    // ==========================================================

    const entryDateGreg =
      this.convertToGregorian(
        this.orderInfo.entryDate
      );


    const exitDateGreg =
      this.convertToGregorian(
        this.orderInfo.exitDate
      );


    // ==========================================================
    // Payload
    // ==========================================================

    const payload = {

      // =========================
      // Clinic / Doctor
      // =========================

      clinicId:
        this.orderInfo.clinicId,

      clinicDoctorId:
        this.orderInfo.clinicDoctorId,


      // =========================
      // Patient
      // =========================

      patientName:
        String(
          this.orderInfo.patientName || ''
        ).trim(),


      /*
       * phoneNumber قابل ویرایش نیست
       * و مستقیماً از ClinicDoctor می‌آید.
       */
      phoneNumber:
        doctorPhone,


      // =========================
      // Order
      // =========================

      orderStatus:
        this.orderInfo.orderStatus,

      invoiceType:
        this.orderInfo.invoiceType,

      invoiceNumber:
        String(
          this.orderInfo.invoiceNumber || ''
        ).trim(),


      // =========================
      // Dates
      // =========================

      entryDate:
        entryDateGreg,

      exitDate:
        exitDateGreg,


      // =========================
      // Items
      // =========================

      items:
        this.items.map(item => ({

          serviceType:
            String(
              item.serviceType || ''
            ).trim(),

          toothNumber:
            String(
              item.toothNumber || ''
            ).trim(),

          quantity:
            Number(
              item.quantity || 0
            ),

          unitPrice:
            Number(
              item.unitPrice || 0
            ),

          totalPrice:
            Number(
              item.quantity || 0
            ) *
            Number(
              item.unitPrice || 0
            )
        })),


      // =========================
      // Financial
      // =========================

      discountAmount:
        Number(
          this.orderInfo.discountAmount || 0
        ),

      grossTotal:
        Number(
          this.orderInfo.grossTotal || 0
        ),

      netTotal:
        Number(
          this.orderInfo.netTotal || 0
        ),


      // =========================
      // Initial Payment
      // =========================

      initialPaymentPercent:
        this.orderInfo.initialPaymentPercent === null
          ? null
          : Number(
              this.orderInfo.initialPaymentPercent
            ),

      initialPaymentAmount:
        Number(
          this.orderInfo.initialPaymentAmount || 0
        ),

      initialPaidAmount:
        Number(
          this.orderInfo.initialPaidAmount || 0
        ),


      // =========================
      // Final Payment
      // =========================

      finalPaymentAmount:
        Number(
          this.orderInfo.finalPaymentAmount || 0
        ),

      finalPaidAmount:
        Number(
          this.orderInfo.finalPaidAmount || 0
        ),


      // =========================
      // Payment
      // =========================

      paidAmount:
        Number(
          this.orderInfo.paidAmount || 0
        ),

      remainingAmount:
        Number(
          this.orderInfo.remainingAmount || 0
        ),


      // =========================
      // Attachments
      // =========================

      deletedAttachmentIds:
        this.deletedAttachmentIds
    };


    console.log(
      '📤 Payload:',
      payload
    );


    // ==========================================================
    // FormData
    // ==========================================================

    const formData =
      new FormData();


    formData.append(
      'data',
      JSON.stringify(payload)
    );


    // ==========================================================
    // New files
    // ==========================================================

    this.orderInfo.attachments.forEach(
      attachment => {

        if (attachment.fileObject) {

          formData.append(
            'files',
            attachment.fileObject,
            attachment.fileName
          );
        }
      }
    );


    // ==========================================================
    // Send
    // ==========================================================

    this.kanbanService
      .updateOrderWithFiles(
        this.orderId!,
        formData
      )
      .subscribe({

        next: (response) => {

          console.log(
            '✅ سفارش با موفقیت بروزرسانی شد:',
            response
          );


          this.isEditMode = false;

          this.deletedAttachmentIds = [];

          this.successMessage =
            'تغییرات سفارش با موفقیت ثبت شد.';

          this.showSuccessModal = true;

          /*
           * بعد از ذخیره، اطلاعات جدید Backend را بگیر
           * تا clinic/doctor/phone و سایر مقادیر دقیق باشند.
           */
          if (this.orderId) {
            this.loadOrderDetail(this.orderId);
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            '❌ خطا در بروزرسانی:',
            error
          );

          this.errorMessage =
            'خطا در ثبت تغییرات. لطفاً مجدداً تلاش کنید.';

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Gregorian → Jalali
  // ============================================================

  private convertToJalali(
    dateStr: string
  ): string {

    try {

      const parts =
        dateStr.split('-');

      const year =
        parseInt(parts[0]);

      const month =
        parseInt(parts[1]);

      const day =
        parseInt(parts[2]);


      const gregorianDate =
        new Date(
          Date.UTC(
            year,
            month - 1,
            day
          )
        );


      const jalali =
        Jalali.toJalali(
          gregorianDate
        );


      return `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`;

    } catch {

      return '';
    }
  }


  // ============================================================
  // Jalali → Gregorian
  // ============================================================

  private convertToGregorian(
    jalaliStr: string
  ): string {

    if (!jalaliStr) {
      return '';
    }

    try {

      const parts =
        jalaliStr.split('/');

      if (parts.length !== 3) {
        return '';
      }


      const year =
        parseInt(parts[0]);

      const month =
        parseInt(parts[1]);

      const day =
        parseInt(parts[2]);


      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day)
      ) {
        return '';
      }


      const gregorianDate =
        Jalali.toGregorian(
          year,
          month,
          day
        );


      const y =
        gregorianDate
          .getUTCFullYear();


      const m =
        String(
          gregorianDate.getUTCMonth() + 1
        ).padStart(2, '0');


      const d =
        String(
          gregorianDate.getUTCDate()
        ).padStart(2, '0');


      return `${y}-${m}-${d}`;

    } catch {

      return '';
    }
  }


  // ============================================================
  // View attachment
  // ============================================================

  viewAttachment(file: Attachment): void {

    if (!file.id) {

      console.error(
        '❌ شناسه فایل موجود نیست.'
      );

      return;
    }


    const newTab =
      window.open(
        '',
        '_blank'
      );


    if (!newTab) {

      console.error(
        '❌ مرورگر اجازه باز کردن تب جدید را نداد.'
      );

      this.validationErrorMessage =
        'مرورگر اجازه باز کردن تب جدید را نداد. لطفاً Popup را فعال کنید.';

      this.showValidationModal = true;

      return;
    }


    newTab.document.write(`
      <html>
        <head>
          <title>در حال بارگذاری فایل...</title>
        </head>

        <body style="
          display:flex;
          justify-content:center;
          align-items:center;
          height:100vh;
          font-family:sans-serif;
        ">
          <h3>⏳ در حال بارگذاری فایل...</h3>
        </body>
      </html>
    `);


    this.attachmentService
      .viewAttachment(file.id)
      .subscribe({

        next: (blob: Blob) => {

          const fileUrl =
            URL.createObjectURL(blob);

          newTab.location.href =
            fileUrl;


          setTimeout(() => {

            URL.revokeObjectURL(
              fileUrl
            );

          }, 60000);
        },

        error: (error) => {

          console.error(
            '❌ خطا در دریافت فایل:',
            error
          );

          newTab.close();

          this.validationErrorMessage =
            'نمایش فایل با خطا مواجه شد.';

          this.showValidationModal = true;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Download attachment
  // ============================================================

  downloadAttachment(
    file: Attachment
  ): void {

    if (!file.id) {

      console.error(
        '❌ شناسه فایل موجود نیست.'
      );

      return;
    }


    this.attachmentService
      .downloadAttachment(file.id)
      .subscribe({

        next: (blob: Blob) => {

          const url =
            window.URL.createObjectURL(blob);


          const a =
            document.createElement('a');

          a.href = url;

          a.download =
            file.fileName;


          document.body.appendChild(a);

          a.click();

          document.body.removeChild(a);

          window.URL.revokeObjectURL(url);
        },

        error: (error) => {

          console.error(
            '❌ خطا در دانلود فایل:',
            error
          );

          this.validationErrorMessage =
            'دانلود فایل با خطا مواجه شد.';

          this.showValidationModal = true;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Order status options
  // ============================================================

  readonly orderStatusOptions = [

    {
      value: 'WAITING_INITIAL_PAYMENT',
      label: 'در انتظار پرداخت اولیه'
    },

    {
      value: 'IN_PRODUCTION',
      label: 'در حال ساخت'
    },

    {
      value: 'WAITING_FINAL_PAYMENT',
      label: 'در انتظار پرداخت نهایی'
    },

    {
      value: 'WAITING_INVOICE_SEND',
      label: 'انتظار ارسال فاکتور'
    },

    {
      value: 'WAITING_PAYMENT',
      label: 'در انتظار پرداخت'
    },

    {
      value: 'DELIVERED',
      label: 'تحویل داده شده'
    }
  ];


  // ============================================================
  // Get status text
  // ============================================================

  getOrderStatusText(
    status: string | null | undefined
  ): string {

    switch (status) {

      case 'WAITING_INITIAL_PAYMENT':
        return 'در انتظار پرداخت اولیه';

      case 'IN_PRODUCTION':
        return 'در حال ساخت';

      case 'WAITING_FINAL_PAYMENT':
        return 'در انتظار پرداخت نهایی';

      case 'WAITING_INVOICE_SEND':
        return 'انتظار ارسال فاکتور';

      case 'WAITING_PAYMENT':
        return 'در انتظار پرداخت';

      case 'DELIVERED':
        return 'تحویل داده شده';

      default:
        return 'نامشخص';
    }
  }

onItemMoneyInput(
  event: Event,
  item: any,
  field: 'unitPrice'
): void {
  const input = event.target as HTMLInputElement;

  const rawValue = input.value.replace(/[^\d]/g, '');

  if (!rawValue) {
    item[field] = 0;
    input.value = '';
    return;
  }

  const numericValue = Number(rawValue);

  item[field] = numericValue;

  input.value = this.formatMoney(numericValue);
}

onItemMoneyBlur(
  event: Event,
  item: any,
  field: 'unitPrice'
): void {
  const input = event.target as HTMLInputElement;

  input.value = this.formatMoney(item[field]);
}
  // ============================================================
  // Close
  // ============================================================

  closeDialog(): void {

    this.closed.emit();
  }
}