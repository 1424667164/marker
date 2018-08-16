import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-conform',
  templateUrl: './conform.component.html',
  styleUrls: ['./conform.component.css']
})
export class ConformComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<ConformComponent>,
    @Inject(MAT_DIALOG_DATA) public name: {}
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnInit() {}
}
