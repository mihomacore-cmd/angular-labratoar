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
  id: number;          // id جدول clinic_doctor
  doctorId: number;    // id پزشک
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


  // ============================================================
  // Inputs / Outputs
  // ============================================================

  @Input() orderId: number | null = null;

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

    clinicId: null as number | null,

    clinicName: '',

    clinicDoctorId: null as number | null,

    doctorName: '',

    patientName: '',

    status: '',

    invoiceType: '',

    phoneNumber: '',

    entryDate: '',
    exitDate: '',

    attachments: [] as Attachment[]
  };


  // ============================================================
  // Items
  // ============================================================

  items: any[] = [];

  discountAmount = 0;


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
  // Deleted attachments
  // ============================================================

  private deletedAttachmentIds: number[] = [];


  // ============================================================
  // Entry date for minDate
  // ============================================================

  get entryDateValue(): JalaliDate | undefined {

    const val = this.orderInfo.entryDate;

    if (!val) {
      return undefined;
    }

    const parts = val.split('/').map(Number);

    if (
      parts.length === 3 &&
      parts.every(p => !isNaN(p))
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

      this.errorMessage = 'شناسه سفارش معتبر نیست.';

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

    this.orderService.getClinics().subscribe({

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

          /*
           * اگر سفارش قبلاً پزشک داشته،
           * همان رکورد clinic_doctor انتخاب می‌شود.
           */
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

              this.orderInfo.clinicDoctorId =
                selectedDoctor.id;

              this.orderInfo.doctorName =
                selectedDoctor.doctorName;

              this.orderInfo.phoneNumber =
                selectedDoctor.phone;
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

          let invoiceTypeKey = 'daily';

          if (data.invoiceType === 'روزانه') {

            invoiceTypeKey = 'daily';

          } else if (data.invoiceType === 'ماهانه') {

            invoiceTypeKey = 'monthly';

          } else if (data.invoiceType) {

            invoiceTypeKey = data.invoiceType;
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

            status:
              data.status || '',

            invoiceType:
              invoiceTypeKey,

            phoneNumber:
              data.phoneNumber || '',

            entryDate,

            exitDate,

            attachments:
              (data.attachments || []).map((att: any) => ({

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
          // Load doctors of selected clinic
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
          // Discount
          // ====================================================

          this.discountAmount =
            data.discountAmount || 0;


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

  onClinicChange(clinicId: number | string | null): void {

    const id =
      clinicId !== null &&
      clinicId !== ''
        ? Number(clinicId)
        : null;


    // ذخیره کلینیک انتخاب‌شده

    this.selectedClinicId = id;

    this.orderInfo.clinicId = id;


    // پزشک قبلی پاک شود

    this.selectedDoctorId = null;

    this.orderInfo.clinicDoctorId = null;

    this.orderInfo.doctorName = '';

    this.orderInfo.phoneNumber = '';


    // لیست پزشکان پاک شود

    this.doctors = [];


    if (!id) {
      return;
    }


    // دریافت پزشکان کلینیک جدید

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


    if (!id) {

      this.orderInfo.doctorName = '';

      this.orderInfo.phoneNumber = '';

      return;
    }


    /*
     * توجه:
     *
     * اینجا doctor.id را پیدا می‌کنیم
     * نه doctor.doctorId
     *
     * چون مقدار select باید clinicDoctor.id باشد.
     */

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


    // نام پزشک

    this.orderInfo.doctorName =
      selectedDoctor.doctorName;


    // شماره تلفن

    this.orderInfo.phoneNumber =
      selectedDoctor.phone;
  }


  // ============================================================
  // Edit mode
  // ============================================================

  toggleEditMode(): void {

    if (!this.isEditMode) {

      this.isEditMode = true;

      return;
    }


    // Cancel edit

    this.isEditMode = false;

    this.deletedAttachmentIds = [];

    this.showEntryDatePicker = false;

    this.showExitDatePicker = false;

    this.exitDateInvalid = false;

    this.showValidationModal = false;

    this.validationErrorMessage = '';


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
  // Items
  // ============================================================

  addItem(): void {

    this.items.push({

      serviceType: '',

      toothNumber: '',

      quantity: 1,

      unitPrice: 0,

      totalPrice: 0
    });
  }


  removeItem(index: number): void {

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
      Number(this.discountAmount || 0),

      0
    );
  }


  formatMoney(value: number): string {

    if (
      value === undefined ||
      value === null ||
      isNaN(value)
    ) {

      return '۰ ریال';
    }

    return (
      value.toLocaleString('fa-IR') +
      ' ریال'
    );
  }


  // ============================================================
  // Attachments
  // ============================================================

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    const files = input.files;

    if (!files) {
      return;
    }


    for (let i = 0; i < files.length; i++) {

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

    const attachment =
      this.orderInfo.attachments[index];


    if (attachment.id) {

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


    this.validateExitDate();


    if (this.exitDateInvalid) {

      this.validationErrorMessage =
        'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';

      this.showValidationModal = true;

      return;
    }


    // ========================================================
    // بررسی کلینیک و پزشک
    // ========================================================

    if (!this.orderInfo.clinicId) {

      this.validationErrorMessage =
        'لطفاً کلینیک را انتخاب کنید.';

      this.showValidationModal = true;

      return;
    }


    if (!this.orderInfo.clinicDoctorId) {

      this.validationErrorMessage =
        'لطفاً پزشک را انتخاب کنید.';

      this.showValidationModal = true;

      return;
    }


    // ========================================================
    // Dates
    // ========================================================

    const entryDateGreg =
      this.convertToGregorian(
        this.orderInfo.entryDate
      );


    const exitDateGreg =
      this.convertToGregorian(
        this.orderInfo.exitDate
      );


    // ========================================================
    // Payload
    // ========================================================

    const payload = {

      // مهم:
      // این همان id رکورد clinic_doctor است

      clinicDoctorId:
        this.orderInfo.clinicDoctorId,

      patientName:
        this.orderInfo.patientName,

      status:
        this.orderInfo.status,

      invoiceType:
        this.orderInfo.invoiceType,

      phoneNumber:
        this.orderInfo.phoneNumber,

      entryDate:
        entryDateGreg,

      exitDate:
        exitDateGreg,

      items:
        this.items.map(item => ({

          serviceType:
            String(item.serviceType || '').trim(),

          toothNumber:
            String(item.toothNumber || '').trim(),

          quantity:
            Number(item.quantity || 0),

          unitPrice:
            Number(item.unitPrice || 0),

          totalPrice:
            this.rowTotal(
              this.items.indexOf(item)
            )
        })),

      discountAmount:
        Number(this.discountAmount || 0),

      deletedAttachmentIds:
        this.deletedAttachmentIds
    };


    console.log(
      '📤 Payload:',
      payload
    );


    // ========================================================
    // FormData
    // ========================================================

    const formData =
      new FormData();


    formData.append(
      'data',
      JSON.stringify(payload)
    );


    // ========================================================
    // New files
    // ========================================================

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


    // ========================================================
    // Send
    // ========================================================

    this.kanbanService
      .updateOrderWithFiles(
        this.orderId!,
        formData
      )
      .subscribe({

        next: (response) => {

          console.log(
            '✅ سفارش بروزرسانی شد:',
            response
          );

          alert(
            'تغییرات با موفقیت ثبت شد!'
          );

          this.isEditMode = false;

          this.deletedAttachmentIds = [];

          this.closeDialog();
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

    try {

      const parts =
        jalaliStr.split('/');

      const year =
        parseInt(parts[0]);

      const month =
        parseInt(parts[1]);

      const day =
        parseInt(parts[2]);


      const gregorianDate =
        Jalali.toGregorian(
          year,
          month,
          day
        );


      const y =
        gregorianDate.getUTCFullYear();

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
  // Close
  // ============================================================

  closeDialog(): void {

    this.closed.emit();
  }
}