/* 공수내모 성적표 — index.html 이 불러 쓰는 부속 파일
   · 학생: 미션 > 성적차트 맨 위 [내 성적표 보기] → 회차를 골라 화면(HTML)으로 봐요.
   · 선생님: 같은 버튼 → 회차 고르고, 학생을 체크해서 [PDF 저장] (여백 없는 A4, 한 학생 한 장).
   · 등급·상위%는 해설집 뒷편 '예상 등급표'와 같은 기준(gsm_grade_cuts.json 의 예상컷 + 같은 점수 분포)이에요. 동형·과제·원본 모두 같은 학교 기준.
   index.html 의 전역(MS, msCatOf, msVis, gsmShown, gsmInfo, gsmEval, GSM_ST, isStaff, me, esc, msEnsure)을 가져다 써요. */
(function () {
  window.GSM_UP = {"낙생고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.7,99.7,99.7,99.6,99.1,99.1,99.1,99.1,97.9,97.8,97.8,97.8,96.1,95.5,95.5,95.5,93.8,92.0,91.9,91.9,91.4,87.6,87.1,87.1,87.1,83.3,81.1,81.0,81.0,79.5,74.6,73.9,73.8,73.8,69.0,66.1,65.9,65.9,64.8,58.7,57.6,57.6,57.6,53.5,49.4,49.2,49.2,48.9,42.7,41.0,40.9,40.9,39.0,33.6,33.1,33.1,33.1,28.9,25.8,25.7,25.7,25.5,20.4,19.2,19.1,19.1,18.1,13.8,13.5,13.5,13.5,11.4,8.9,8.8,8.8,8.8,6.3,5.3,5.3,5.3,5.3,3.0,2.8,2.8,2.8,2.7,1.2,1.1,1.1,1.1,1.0,0.3,0.3],"늘푸른고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.7,99.7,99.7,99.5,99.3,99.3,99.3,98.8,98.5,98.4,98.4,97.5,97.1,97.0,96.7,95.6,95.0,94.8,94.3,92.8,91.9,91.5,90.9,89.1,87.9,87.2,86.6,84.5,82.8,81.7,81.2,79.1,76.8,75.1,74.3,72.8,70.5,68.1,66.7,65.6,63.6,61.0,58.7,57.5,56.3,53.9,51.1,49.1,48.0,46.6,44.1,41.4,39.5,38.5,37.2,34.7,32.1,30.4,29.7,28.5,26.2,23.6,22.1,21.6,20.9,18.8,16.4,15.0,14.6,14.2,12.8,10.7,9.4,8.9,8.8,7.9,6.3,5.1,4.8,4.7,4.7,3.2,2.4,2.0,1.9,1.9,1.9,0.7,0.5,0.5],"돌마고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.7,99.6,99.6,99.6,99.3,99.0,98.9,98.9,98.6,97.9,97.7,97.7,97.4,96.2,95.8,95.7,95.6,93.9,93.0,92.8,92.8,91.3,89.4,89.0,88.9,88.1,85.2,84.0,83.7,83.6,80.7,78.3,77.5,77.3,76.2,72.2,70.4,69.8,69.8,66.4,63.2,61.6,61.3,60.7,56.3,53.6,52.4,52.3,50.2,46.4,43.7,43.1,43.0,39.8,36.6,34.2,33.9,33.7,30.5,27.2,25.6,25.5,24.8,22.6,19.0,18.2,18.2,17.2,15.5,12.3,12.0,12.0,11.3,9.2,7.4,7.3,7.2,6.7,4.9,4.0,4.0,3.9,3.3,2.2,1.8,1.8,1.8,1.4,0.6,0.5],"보라고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.6,99.6,99.6,99.3,98.9,98.9,98.9,98.5,97.7,97.6,97.6,97.3,95.7,95.4,95.3,95.2,92.9,92.1,92.0,91.8,89.7,87.9,87.5,87.1,86.2,82.7,81.8,81.2,80.8,77.3,75.5,74.5,73.6,72.1,68.5,67.2,65.8,65.1,61.8,59.9,58.2,56.7,55.3,52.5,50.7,48.7,47.5,45.2,43.6,41.5,39.6,38.1,36.1,34.7,32.6,31.2,29.4,28.2,26.5,24.7,23.1,21.6,20.7,19.4,18.1,16.0,15.1,14.3,13.2,12.3,10.6,10.1,9.4,8.3,7.4,6.5,6.2,5.8,4.7,3.8,3.6,3.4,3.0,2.4,1.8,1.7,1.6,0.8,0.8],"보평고":[100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.8,99.2,99.2,99.2,99.2,97.8,97.7,97.7,97.7,95.7,95.3,95.1,95.0,92.8,91.8,91.3,91.2,89.2,87.4,86.4,86.1,84.8,82.5,80.9,80.2,79.6,77.2,74.9,73.4,72.9,71.4,68.9,66.7,65.5,64.8,62.9,60.3,58.2,57.2,56.2,54.2,51.5,49.6,48.8,47.7,45.6,43.0,41.3,40.6,39.5,37.4,35.0,33.4,32.8,32.0,29.9,27.6,26.2,25.7,25.0,23.1,21.0,19.7,19.4,18.8,17.2,15.3,14.2,13.9,13.6,12.2,10.4,9.5,9.4,9.2,8.2,6.6,5.8,5.7,5.7,5.1,3.7,3.1,3.0,3.0,2.8,1.8,1.3,1.3,1.3,1.3,0.6,0.4,0.3],"분당고":[100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.5,99.1,99.1,99.1,98.7,97.7,97.4,97.4,97.4,95.5,94.8,94.7,94.7,92.9,91.1,90.7,90.6,89.8,87.1,85.8,85.6,85.4,83.1,80.3,79.5,79.4,78.5,75.2,72.9,72.4,72.3,70.5,66.9,65.1,64.8,64.6,61.8,58.3,57.0,56.9,56.4,52.9,49.8,48.9,48.9,48.1,44.3,41.7,41.1,41.0,39.9,36.0,33.9,33.6,33.5,32.2,28.6,26.9,26.6,26.6,25.2,21.9,20.5,20.3,20.3,18.9,16.0,14.9,14.8,14.8,13.6,11.0,10.1,10.0,10.0,9.1,6.9,6.3,6.2,6.2,5.8,4.0,3.4,3.4,3.4,3.4,1.8,1.5,1.5,1.5,1.5,0.6,0.4,0.4],"분당대진고":[100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.5,99.5,99.5,99.5,98.5,98.3,98.2,98.2,98.2,96.1,95.7,95.5,95.5,93.4,92.8,91.5,91.2,90.7,88.5,86.3,85.5,85.4,83.8,82.0,79.1,78.5,78.0,76.2,73.4,70.9,70.4,69.4,68.0,64.2,62.6,61.6,60.3,59.0,55.2,54.2,52.3,51.4,49.3,46.6,45.7,43.4,42.8,40.3,38.6,37.0,35.1,34.6,32.3,31.3,29.0,27.6,27.0,25.2,24.6,22.0,21.0,20.3,19.0,18.5,15.9,15.4,14.4,13.7,13.0,11.0,10.7,9.8,9.3,8.6,7.2,6.9,6.0,5.8,5.3,4.4,3.9,3.2,3.1,2.7,2.4,2.0,1.4,1.4,1.4,1.1,0.7,0.4,0.4],"불곡고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.8,99.7,99.7,99.5,99.4,99.3,99.1,98.9,98.8,98.6,98.2,97.9,97.7,97.3,96.9,96.6,96.2,95.6,95.0,94.7,94.1,93.3,92.7,92.2,91.3,90.4,89.6,89.0,87.9,86.8,86.0,85.2,83.8,82.4,81.6,80.5,78.9,77.4,76.4,75.1,73.2,71.5,70.4,69.0,67.0,65.0,63.8,62.5,60.2,57.9,56.6,55.3,52.9,50.3,48.7,47.8,45.4,42.4,40.5,39.8,37.7,34.4,32.3,31.5,30.2,27.0,24.4,23.3,22.9,20.4,17.5,16.0,15.6,14.6,11.9,10.1,9.4,9.3,7.7,5.8,5.0,4.8,4.7,3.4,2.3,2.0,1.9,1.9,1.1,0.6,0.5],"서천고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.6,99.6,99.5,99.5,99.2,99.1,99.0,98.9,98.6,98.4,98.1,97.9,97.6,97.2,96.8,96.5,96.1,95.6,94.9,94.4,94.0,93.5,92.5,91.4,91.0,90.4,89.4,87.8,86.8,86.3,85.6,83.4,81.7,80.9,80.2,78.6,75.8,74.2,73.6,72.9,69.6,66.7,65.4,64.7,63.4,59.3,56.7,55.5,54.8,52.4,48.7,45.9,44.8,44.1,41.5,37.6,35.0,34.1,33.4,30.6,27.4,25.0,24.1,23.3,21.2,17.9,16.4,15.6,14.7,13.5,10.6,9.9,9.2,7.9,7.2,5.7,5.3,5.0,3.4,3.0,2.4,2.4,2.3,1.1,0.7,0.7],"서현고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.8,99.5,99.4,99.4,99.4,99.0,98.7,98.7,98.7,98.1,97.6,97.5,97.5,96.8,95.8,95.6,95.5,94.9,93.5,92.8,92.7,92.4,90.6,89.3,88.9,88.9,87.3,85.0,84.2,84.0,83.4,80.4,78.4,78.0,77.9,75.7,72.2,70.9,70.8,70.3,66.5,63.4,62.7,62.6,61.1,56.3,54.0,53.6,53.6,50.6,45.8,44.3,44.1,44.1,39.8,35.8,34.9,34.8,34.8,29.5,26.3,25.8,25.8,25.8,20.3,17.9,17.6,17.6,17.6,12.7,11.0,10.8,10.8,10.8,6.9,5.8,5.7,5.7,5.7,3.1,2.4,2.4,2.4,2.4,1.1,0.6,0.6],"송림고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.7,99.6,99.6,99.6,99.2,99.2,99.2,98.7,98.4,98.4,98.4,97.3,97.1,97.1,96.7,95.3,95.2,95.2,93.7,92.5,92.5,92.4,89.6,88.8,88.8,88.3,84.6,84.1,84.1,82.6,78.7,78.4,78.2,75.4,71.9,71.6,71.3,67.2,64.3,64.0,63.4,58.6,56.1,55.8,54.8,49.5,47.7,47.1,45.8,40.8,39.3,38.5,36.9,32.6,31.5,30.5,28.5,25.2,24.3,23.1,20.9,18.8,17.9,16.7,14.5,13.3,12.5,11.3,9.7,9.2,8.2,7.2,6.1,5.7,4.9,4.3,4.0,3.4,2.6,2.1,2.0,1.7,1.6,1.1,0.9,0.5,0.4],"수내고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.7,99.7,99.7,99.7,99.7,99.1,99.0,99.0,99.0,99.0,97.7,97.7,97.7,97.7,97.2,95.4,95.4,95.4,95.4,93.9,92.0,92.0,92.0,92.0,89.4,87.5,87.5,87.5,87.5,83.8,81.8,81.8,81.8,81.8,77.2,75.0,75.0,75.0,75.0,69.7,67.3,67.3,67.3,67.3,61.6,58.9,58.9,58.9,58.9,53.2,50.1,50.1,50.1,50.1,44.8,41.4,41.4,41.4,41.4,36.9,32.8,32.8,32.8,32.8,29.3,24.6,24.6,24.6,24.6,22.4,17.4,17.3,17.3,17.3,16.4,11.2,11.1,11.1,11.1,10.9,6.3,6.2,6.2,6.2,6.2,2.9,2.7,2.7,2.7,2.7,1.2,0.7,0.7],"신갈고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.8,99.5,99.5,99.5,99.5,99.1,98.8,98.8,98.8,98.8,97.6,97.5,97.5,97.5,96.0,95.5,95.5,95.5,94.9,92.8,92.7,92.7,92.7,89.4,88.8,88.8,88.8,87.2,83.8,83.7,83.7,83.7,78.2,77.4,77.4,77.4,74.7,69.8,69.8,69.8,69.8,62.5,61.1,61.1,61.1,58.7,51.9,51.8,51.8,51.8,44.5,42.0,42.0,42.0,41.2,33.0,32.6,32.6,32.6,28.3,23.9,23.8,23.8,23.8,17.4,16.3,16.3,16.3,16.0,10.5,10.3,10.3,10.3,8.4,5.9,5.9,5.9,5.9,3.5,2.9,2.9,2.9,2.9,1.2,1.2,1.2,1.2,1.2,0.3,0.3],"야탑고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.6,99.5,99.5,99.5,99.0,98.9,98.9,98.8,98.2,97.8,97.7,97.7,97.1,96.3,96.1,95.9,95.7,94.3,93.8,93.5,93.4,92.1,91.0,90.5,90.1,89.4,87.6,86.8,86.1,85.8,83.9,82.6,81.5,80.8,80.0,77.9,76.6,75.3,74.7,72.6,71.3,69.4,68.2,67.3,65.2,63.4,61.5,60.7,58.6,57.4,55.1,53.5,52.0,50.2,48.3,46.2,45.2,42.7,41.8,39.6,38.0,35.8,34.0,32.9,30.9,30.1,26.8,26.0,24.2,23.1,21.2,19.2,18.8,16.5,16.1,13.6,12.8,11.4,10.0,9.9,8.1,7.8,5.1,4.8,4.8,4.2,4.1,1.4,1.4],"영덕여고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.8,99.4,99.4,99.4,99.4,98.7,98.5,98.5,98.5,97.8,97.1,97.1,96.9,96.7,95.0,94.9,94.7,94.5,92.6,91.9,91.8,91.2,90.3,88.1,87.9,87.0,86.7,84.0,83.1,82.6,81.3,80.1,77.6,77.4,75.3,74.7,72.0,71.0,69.8,67.5,66.8,64.1,63.8,60.5,59.4,57.6,56.1,55.2,51.3,51.0,48.3,47.8,44.6,42.7,41.9,39.6,39.4,35.0,34.5,32.4,31.1,29.8,26.9,26.8,23.5,23.1,20.9,19.9,18.7,16.0,16.0,14.0,13.8,11.2,10.0,9.9,8.8,8.8,5.6,5.3,5.3,4.8,4.8,2.2,2.2,2.2,2.1,2.1,0.6,0.6],"운중고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.8,99.5,99.4,99.4,99.3,99.0,98.8,98.7,98.6,98.0,97.8,97.6,97.5,96.7,96.2,95.9,95.8,94.9,94.2,93.7,93.4,92.6,91.6,90.8,90.3,89.6,88.4,87.3,86.5,85.8,84.6,83.3,81.9,81.2,80.0,78.5,77.0,75.7,74.6,73.3,71.3,69.6,68.5,67.1,65.5,63.3,61.5,60.3,59.0,56.7,54.4,52.6,51.5,50.3,47.5,44.8,43.2,42.2,40.9,38.2,35.0,33.6,33.0,31.4,28.6,25.4,24.4,24.0,22.8,19.4,16.7,16.1,15.9,15.1,12.0,9.4,9.0,9.0,8.5,6.0,4.1,4.0,4.0,4.0,1.7,1.1,1.1],"이매고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.6,99.6,99.6,99.4,99.0,98.9,98.9,98.8,97.9,97.7,97.7,97.7,96.3,95.8,95.8,95.8,94.6,93.4,93.1,93.1,92.4,90.4,89.6,89.5,89.5,87.0,85.5,84.9,84.8,83.6,80.9,79.5,79.3,79.3,76.5,73.9,73.1,73.0,72.0,68.7,66.3,66.0,65.9,63.9,59.8,58.5,58.3,58.0,54.6,51.0,50.3,50.2,49.5,44.9,42.4,42.1,42.1,40.6,35.6,34.0,33.9,33.9,30.9,26.9,26.2,26.1,26.1,22.6,19.2,18.9,18.9,18.9,14.5,12.7,12.6,12.6,12.3,8.0,7.3,7.3,7.3,7.3,3.5,3.4,3.4,3.4,2.6,1.0,0.9],"태원고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.8,99.8,99.8,99.8,99.6,99.5,99.5,99.5,99.1,99.0,99.0,99.0,98.5,98.2,98.2,98.1,97.4,97.0,96.9,96.8,95.9,95.3,95.2,95.0,94.0,93.1,92.8,92.7,91.6,90.3,89.8,89.6,88.6,86.8,86.0,85.7,84.8,82.8,81.5,81.0,80.4,78.3,76.4,75.5,75.0,73.2,70.7,69.3,68.7,67.5,64.8,62.7,61.7,61.0,58.5,55.9,54.3,53.6,52.2,49.1,46.7,45.4,45.0,42.7,39.6,37.4,36.6,35.7,33.0,30.2,28.4,28.1,26.4,23.9,21.0,20.0,19.8,18.0,15.2,12.9,12.6,12.2,11.0,7.5,6.5,6.5,6.0,4.9,2.3,2.1],"판교고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.7,99.7,99.7,99.4,99.2,99.2,99.2,98.6,98.3,98.3,98.3,97.2,96.6,96.5,96.5,95.2,94.2,93.9,93.9,92.6,90.8,90.2,90.1,89.4,86.9,85.5,85.1,85.1,82.5,80.1,79.1,78.9,78.0,74.6,72.4,71.8,71.7,69.4,65.8,64.2,64.0,63.6,60.2,56.8,55.7,55.6,54.9,50.6,47.8,47.2,47.2,46.0,41.2,39.2,38.8,38.8,37.1,32.5,31.0,30.8,30.8,28.6,24.4,23.5,23.4,23.4,20.8,17.4,16.8,16.7,16.7,14.1,11.4,11.1,11.1,11.1,8.5,6.6,6.5,6.5,6.5,4.5,3.1,3.0,3.0,3.0,1.5,0.9,0.9],"한솔고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.6,99.5,99.5,99.4,99.1,99.0,98.9,98.6,98.2,98.1,97.9,97.4,96.9,96.7,96.4,95.6,95.0,94.8,94.1,93.1,92.5,92.0,91.3,90.0,89.2,88.6,87.8,86.4,85.3,84.4,83.4,81.9,80.8,79.7,78.4,77.0,75.6,74.3,72.7,71.5,69.8,68.4,66.6,65.3,63.5,61.9,60.2,58.5,56.9,55.1,53.6,51.6,50.2,47.9,46.4,44.7,43.3,40.9,39.2,37.8,35.8,34.1,31.7,30.6,28.7,27.7,24.9,23.6,22.1,20.4,18.6,17.0,16.5,13.7,13.1,11.3,10.7,8.7,7.0,6.1,5.9,5.9,2.6,2.3]};
  var GC = ['', '#0B1A31', '#2F4F8F', '#7F93BD', '#C79B63', '#DCCBAA'], GT = ['', '#fff', '#fff', '#fff', '#fff', '#4a4030'];
  var NAVY = '#1f3a6e', ROSE = '#b76e79', GOLD = '#c9a55d', CATS = ['내모미션', '과제미션', '원본미션'];
  var V = { ex: null, sel: {}, open: false };

  var ESS = {}, TAGS = [['skip', '풀이 과정 생략', '풀이 과정을 한 줄씩 빠짐없이 쓰는 연습이 필요해요(과정 점수가 따로 있어요).'],
    ['calc', '계산 실수', '계산 과정을 줄 맞춰 쓰고 마지막에 반드시 검산하세요.'], ['cond', '조건 누락', '문제의 조건을 먼저 표시하고, 풀이에서 모두 사용했는지 확인하세요.'],
    ['concept', '개념·공식 오류', '관련 개념과 공식을 정확히 쓰고 적용하는 연습이 필요해요.'], ['ans', '답만 기재', '답만 쓰지 말고, 근거가 되는 식을 반드시 함께 쓰세요.'],
    ['part', '부분점수만', '마지막 단계까지 끝내는 연습이 필요해요(끝까지 푸는 습관).'], ['mark', '표기·서술 부정확', '수학 기호와 용어를 정확히 쓰고, 문장으로도 풀이를 연결하세요.'],
    ['time', '시간 부족·미완성', '서술형은 쉬운 것부터 시간 배분을 정해 푸는 연습이 필요해요.']];
  function tagOf(id) { for (var i = 0; i < TAGS.length; i++) if (TAGS[i][0] === id) return TAGS[i]; return null; }
  async function omrApi(a, args) { try { var r = await fetch(API_URL.replace('ac_api', 'ac_omr'), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: API_KEY, Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify({ p_action: a, p_token: TOKEN, p_args: args || {} }) }); return r.ok ? await r.json() : { ok: false }; } catch (e) { return { ok: false }; } }
  async function essOf(it) {
    var id = it.m.id; if (ESS[id] !== undefined) return ESS[id];
    var j = await omrApi('emeta', { exam_id: id }), o = null;
    if (j && j.ok && (j.es_max || []).length) { o = { max: j.es_max.map(Number), rows: {} }; (j.rows || []).forEach(function (r) { o.rows[r.sid] = r; }); }
    ESS[id] = o; return o;
  }
  function r1(v) { return Math.round(v * 10) / 10; }
  function kindOf(it) { var c = msCatOf(it); return c === '과제미션' ? '과제' : c === '원본미션' ? '원본' : '동형'; }
  function kindCol(k) { return k === '과제' ? '#8a2d4a' : k === '원본' ? '#2f7d5b' : NAVY; }
  function dd(it) { return String(it.ex.date || '').slice(0, 10); }
  function exams() {
    if (!MS || !MS.items) return [];
    return MS.items.filter(function (it) { return msVis(it) && CATS.indexOf(msCatOf(it)) >= 0 && gsmShown(it) && it.roster && it.roster.length; })
      .sort(function (a, b) { return dd(a).localeCompare(dd(b)) || String(a.ex.name).localeCompare(String(b.ex.name), 'ko'); });
  }
  function rowOf(it, key) {
    var rs = (isStaff() ? it.all : it.roster) || [];
    for (var i = 0; i < rs.length; i++) { var r = rs[i]; if (r.ox && r.score != null && (isStaff() ? r.k === key : r.me)) return r; }
    return null;
  }
  function totalOf(it) { return r1((it.ex.items || []).reduce(function (a, x) { return a + (+x.pts || 1); }, 0)) || 100; }
  /* 한 학생 · 한 회차 계산 */
  function essFor(it, key) {
    var eo = ESS[it.m.id]; if (!eo) return null; var sr = null;
    if (isStaff()) sr = eo.rows[key] || null; else { var ks = Object.keys(eo.rows); sr = ks.length ? eo.rows[ks[0]] : null; }
    var mx = r1(eo.max.reduce(function (a, b) { return a + b; }, 0)), graded = !!(sr && sr.es_total != null);
    return { max: eo.max, mx: mx, got: (sr && sr.es) || [], tags: (sr && sr.tags) || [], total: graded ? +sr.es_total : null, graded: graded, has: !!sr, sid: sr && sr.sid, ks: (sr && sr.ks) || [], hw: (sr && sr.hw) || {}, ex: it.m.id };
  }
  function calc(it, row, key) {
    var inf = gsmInfo(it), sc = r1(+row.score), ex = it.ex, items = ex.items || [], es = essFor(it, key), objTot = totalOf(it);
    var peers = it.roster.filter(function (r) { return r.score != null; }), n = peers.length, rk = 1, sum = 0;
    peers.forEach(function (r) { if (+r.score > +row.score) rk++; sum += +r.score; });
    var ev = gsmEval(inf.school, sc), st = GSM_ST[inf.school] || null, ox = String(row.ox || '');
    var rows = items.map(function (x, i) { return { no: x.no || (i + 1), unit: x.unit || '', typ: x.typ || '객관식', pts: +x.pts || 0, c: ox.charAt(i) || '' }; });
    var un = {}, order = [];
    rows.forEach(function (q) { if (!q.unit) return; if (!un[q.unit]) { un[q.unit] = { t: 0, g: 0 }; order.push(q.unit); } un[q.unit].t++; if (q.c === 'O') un[q.unit].g++; });
    return { it: it, inf: inf, kind: kindOf(it), sc: sc, es: es, objTot: objTot, obj: es && es.graded ? r1(sc - es.total) : sc, tot: es && es.graded ? r1(objTot + es.mx) : objTot, n: n, rk: rk, avg: n ? r1(sum / n) : null, ev: ev, st: st, rows: rows, un: un, order: order,
      cuts: st ? st.slice(2, 6) : null, nm: ex.name, date: dd(it) };
  }
  function upperAt(school, s) { return gsmEval(school, s) ? gsmEval(school, s).top : null; }

  /* ── 성적표 한 쪽 ── */
  function scaleHtml(d) {
    if (!d.cuts) return '<div class="rp-mut">이 학교의 등급컷 자료가 없어요.</div>';
    var T = d.tot, c = d.cuts, b = [0, c[3], c[2], c[1], c[0], T], pc = function (v) { return Math.max(0, Math.min(100, v / T * 100)); }, h = '<div class="rp-sc">';
    for (var g = 5; g >= 1; g--) { var lo = b[5 - g], hi = b[6 - g]; h += '<i style="width:' + (pc(hi) - pc(lo)) + '%;background:' + GC[g] + ';color:' + GT[g] + '">' + g + '등급</i>'; }
    h += '</div><div class="rp-scl">';
    [c[3], c[2], c[1], c[0]].forEach(function (v) { h += '<span style="left:' + pc(v) + '%">' + v + '</span>'; });
    h += '</div><div class="rp-mk">';
    if (d.avg != null) h += '<em class="a" style="left:' + pc(d.avg) + '%"><b>반 평균 ' + d.avg + '</b></em>';
    h += '<em class="m" style="left:' + pc(d.sc) + '%"><b>내 점수 ' + d.sc + '</b></em></div>';
    return h;
  }
  function gradeTable(d) {
    if (!d.cuts) return '';
    var c = d.cuts, T = d.tot, rg = [[c[0], T], [c[1], c[0]], [c[2], c[1]], [c[3], c[2]], [0, c[3]]], h = '<table class="rp-gt"><tr><th>등급</th><th>점수 범위</th><th>누적 상위</th></tr>';
    for (var g = 1; g <= 5; g++) {
      var up = g < 5 ? Math.round(upperAt(d.inf.school, c[g - 1])) + '%' : '100%', me = d.ev && d.ev.grade === g;
      h += '<tr' + (me ? ' class="me"' : '') + '><td><b style="background:' + GC[g] + ';color:' + GT[g] + '">' + g + '</b></td><td>' + (g === 1 ? c[0] + ' 이상' : g === 5 ? c[3] + ' 미만' : c[g - 1] + ' ~ ' + rg[g - 1][1] + ' 미만') + '</td><td>~ ' + up + '</td></tr>';
    }
    return h + '</table>';
  }
  function itemsHtml(d) {
    var R = d.rows, half = Math.ceil(R.length / 2), col = function (a) {
      return '<table class="rp-qt"><tr><th>번호</th><th>유형</th><th>단원</th><th>배점</th><th>결과</th></tr>' + a.map(function (q) {
        var s = q.c === 'O' ? '<b class="o">○</b>' : q.c === 'X' ? '<b class="x">✕</b>' : q.c === 'T' ? '<b class="t">△</b>' : '<span class="rp-mut">·</span>';
        return '<tr class="' + (q.c === 'X' ? 'bad' : '') + '"><td>' + q.no + '</td><td>' + (q.typ === '서술형' ? '서술' : '객관') + '</td><td class="u">' + esc(q.unit) + '</td><td>' + q.pts + '</td><td>' + s + '</td></tr>';
      }).join('') + '</table>';
    };
    return '<div class="rp-two">' + col(R.slice(0, half)) + (R.length > 1 ? col(R.slice(half)) : '') + '</div>';
  }
  function unitHtml(d) {
    if (!d.order.length) return '<div class="rp-mut">단원 정보가 없어요.</div>';
    return d.order.map(function (u) {
      var x = d.un[u], p = Math.round(x.g / x.t * 100);
      return '<div class="rp-ub"><span class="n">' + esc(u) + '<small>' + x.g + '/' + x.t + '</small></span><span class="b"><i style="width:' + p + '%;background:' + (p >= 80 ? '#2f7d5b' : p >= 50 ? GOLD : '#b84a4a') + '"></i></span><span class="p">' + p + '%</span></div>';
    }).join('');
  }
  function noteHtml(d) {
    var bad = d.rows.filter(function (q) { return q.c === 'X'; }).map(function (q) { return q.no; }), tri = d.rows.filter(function (q) { return q.c === 'T'; }).map(function (q) { return q.no; });
    var wk = null; d.order.forEach(function (u) { var x = d.un[u]; if (x.t >= 2 && x.g < x.t && (!wk || x.g / x.t < d.un[wk].g / d.un[wk].t)) wk = u; });
    var s = [];
    s.push(bad.length ? '<b>다시 볼 문제</b> ' + bad.join(', ') + '번 (' + bad.length + '개)' : '<b>틀린 문제가 없어요!</b> 정말 잘했어요.');
    if (tri.length) s.push('<b>서술형 부분 점수</b> ' + tri.join(', ') + '번');
    if (wk) s.push('<b>먼저 챙길 단원</b> ' + esc(wk) + ' (' + d.un[wk].g + '/' + d.un[wk].t + ')');
    if (d.ev && d.ev.grade > 1 && d.cuts) { var gap = r1(d.cuts[d.ev.grade - 2] - d.sc); if (gap > 0) s.push('<b>' + (d.ev.grade - 1) + '등급까지</b> ' + gap + '점 남았어요'); }
    return s.map(function (x) { return '<div>' + x + '</div>'; }).join('');
  }
  function histHtml(key, upto) {
    var h = '<table class="rp-ht"><tr><th>날짜</th><th>회차</th><th>구분</th><th>학교</th><th>점수</th><th></th><th>등급</th><th>상위</th><th>석차</th></tr>', k = 0;
    exams().forEach(function (it) {
      if (dd(it) > dd(upto.it) || (dd(it) === dd(upto.it) && String(it.ex.name) > String(upto.it.ex.name))) return;
      var row = rowOf(it, key); if (!row) return; var d = calc(it, row, key); k++;
      h += '<tr' + (it === upto.it ? ' class="me"' : '') + '><td>' + d.date.slice(5).replace('-', '/') + '</td><td>' + (d.inf.n ? d.inf.n + '회' : '') + '</td><td><b style="color:' + kindCol(d.kind) + '">' + d.kind + '</b></td><td>' + esc(d.inf.school || '') + '</td><td><b>' + d.sc + '</b></td>' +
        '<td class="bar"><i style="width:' + Math.min(100, d.sc / d.tot * 100) + '%;background:' + kindCol(d.kind) + '"></i></td><td>' + (d.ev ? '<b class="gc" style="background:' + GC[d.ev.grade] + ';color:' + GT[d.ev.grade] + '">' + d.ev.grade + '</b>' : '-') + '</td><td>' + (d.ev ? Math.round(d.ev.top) + '%' : '-') + '</td><td>' + d.rk + '/' + d.n + '</td></tr>';
    });
    return k ? h + '</table>' : '';
  }
  function essPage(name, d) {
    var E = d.es, n = E.max.length, W = n >= 4 ? 104 : 118, got = E.total == null ? 0 : E.total, rate = E.mx ? Math.round(got / E.mx * 100) : 0, orate = d.objTot ? Math.round(d.obj / d.objTot * 100) : 0, tg = {};
    (E.tags || []).forEach(function (t) { ((t && t.t) || []).forEach(function (x) { tg[x] = (tg[x] || 0) + 1; }); });
    var top = Object.keys(tg).sort(function (a, b) { return tg[b] - tg[a]; }).slice(0, 2).map(tagOf).filter(Boolean), sum;
    if (!E.graded) sum = '서술형 채점이 끝나면 점수와 보완할 점이 여기에 나와요.';
    else sum = '서술형 <b>' + E.total + ' / ' + E.mx + '점 (' + rate + '%)</b>' + (rate < orate - 5 ? ' — 객관식 정답률(' + orate + '%)보다 낮아요. 아는 문제도 <b>풀이 과정</b>까지 써야 점수가 되니 과정 쓰기를 연습해요.' : (rate >= 85 ? ' — 서술형을 아주 잘 풀었어요!' : '.')) +
      (top.length ? '<br>가장 자주 나온 감점 이유: <b>' + top.map(function (t) { return esc(t[1]); }).join('</b>, <b>') + '</b>' : '');
    var blocks = E.max.map(function (m, k) {
      var v = E.got[k], t0 = E.tags[k] || {}, ts = (t0.t || []).map(tagOf).filter(Boolean), has = v != null, r = has && m ? v / m : 0, ih = r1(W * (k === 0 ? 57 / 182 : (248 / 3) / 182));
      var st = !has ? '<span class="rp-chip">채점 전</span>' : v >= m ? '<span class="rp-chip ok">만점</span>' : v <= 0 ? '<span class="rp-chip bad">0점</span>' : '<span class="rp-chip mid">부분 점수</span>';
      return '<div class="rp-eb"><div class="rp-ei" style="width:' + W + 'mm;height:' + ih + 'mm"><img class="rp-eimg" alt="서술형 ' + (k + 1) + '" data-ex="' + E.ex + '" data-sid="' + (E.sid || '') + '" data-k="' + (k + 1) + '" style="width:' + W + 'mm;height:' + ih + 'mm"></div>' +
        '<div class="rp-ep"><div class="rp-en">서술형 ' + (k + 1) + ' ' + st + '</div><div class="rp-es"><b>' + (has ? v : '-') + '</b><span> / ' + m + '점</span></div><div class="rp-eb2"><i style="width:' + Math.round(r * 100) + '%;background:' + (r >= .85 ? '#2f7d5b' : r >= .5 ? GOLD : '#b84a4a') + '"></i></div>' +
        (has && v < m ? (ts.length ? '<div class="rp-tg">' + ts.map(function (t) { return '<span>' + esc(t[1]) + '</span>'; }).join('') + '</div><div class="rp-ad">' + ts.map(function (t) { return esc(t[2]); }).join(' ') + '</div>' : '<div class="rp-ad rp-mut">감점 이유가 기록되지 않았어요. 감점된 부분을 다시 확인해 보세요.</div>') : (has ? '<div class="rp-ad">풀이 과정과 답이 모두 잘 쓰였어요.</div>' : '')) +
        (t0.m ? '<div class="rp-cm">✍ ' + esc(t0.m) + '</div>' : '') + '</div></div>';
    }).join('');
    return '<section class="rp pg"><div class="rp-hd sm"><div><div class="rp-br">MATHY YURI · 분당미래탐구</div><div class="rp-tt">서술형 분석</div></div><div class="rp-nm"><small>이름</small>' + esc(name) + '</div></div>' +
      '<div class="rp-ex"><b style="background:' + kindCol(d.kind) + '">' + d.kind + '</b><span>' + esc(d.nm) + '</span><em>' + d.date.replace(/-/g, '.') + '</em></div>' +
      '<div class="rp-note" style="margin-top:1mm">' + sum + '</div>' + '<div class="rp-ebs">' + blocks + '</div>' +
      '<div class="rp-ft">서술형은 정답만큼 <b>풀이 과정</b>이 점수가 돼요. 답안 사진은 답안지 칸을 번호별로 잘라 보관한 것이에요.</div></section>';
  }
  function pagesHtml(name, key, d) {
    var h = '<div class="pgw">' + pageHtml(name, key, d) + '</div>';
    if (d.es && d.es.has && d.es.graded) h += '<div class="pgw">' + essPage(name, d) + '</div>';
    return h;
  }
  function pageHtml(name, key, d) {
    var ev = d.ev, g = ev ? ev.grade : 0;
    return '<section class="rp pg">' +
      '<div class="rp-hd"><div><div class="rp-br">MATHY YURI · 분당미래탐구</div><div class="rp-tt">공수내모 성적표</div></div><div class="rp-nm"><small>이름</small>' + esc(name) + '</div></div>' +
      '<div class="rp-ex"><b style="background:' + kindCol(d.kind) + '">' + d.kind + '</b><span>' + esc(d.nm) + '</span><em>' + d.date.replace(/-/g, '.') + '</em></div>' +
      '<div class="rp-kpi"><div><small>내 점수</small><b>' + d.sc + '</b><span>/ ' + d.tot + '점' + (d.es && d.es.graded ? '<br>객관식 ' + d.obj + ' + 서술형 ' + d.es.total : (d.es && d.es.has ? '<br>서술형 채점 전(객관식 점수)' : '')) + '</span></div>' +
      '<div><small>등급 · ' + esc(d.inf.school || '학교') + ' 기준</small>' + (ev ? '<b class="g" style="background:' + GC[g] + ';color:' + GT[g] + '">' + g + '등급</b><span>상위 ' + (ev.top < 1 ? '1% 이내' : Math.round(ev.top) + '%') + '</span>' : '<b>-</b><span>등급컷 자료 없음</span>') + '</div>' +
      '<div><small>우리 반</small><b>' + d.rk + '위</b><span>' + d.n + '명 중 · 평균 ' + (d.avg == null ? '-' : d.avg) + '점</span></div></div>' +
      '<div class="rp-sec"><h4>등급 위치</h4><div class="rp-row"><div class="rp-sc-w">' + scaleHtml(d) + '</div><div class="rp-gt-w">' + gradeTable(d) + '</div></div></div>' +
      '<div class="rp-sec"><h4>문항별 결과 <small>○ 맞힘 · ✕ 틀림 · △ 부분 점수</small></h4>' + itemsHtml(d) + '</div>' +
      '<div class="rp-row2"><div class="rp-sec"><h4>단원별 정답률</h4>' + unitHtml(d) + '</div><div class="rp-sec"><h4>선생님 한마디 · 체크</h4><div class="rp-note">' + noteHtml(d) + '</div></div></div>' +
      '<div class="rp-sec"><h4>회차별 누적 기록</h4>' + histHtml(key, d) + '</div>' +
      '<div class="rp-ft">등급·상위%는 해설집 뒷편 「예상 등급표」와 같은 기준(학교별 예상 등급컷·점수 분포)이에요. 실제 학교 시험 결과와는 다를 수 있어요.</div></section>';
  }
  var CSS = '.rpov{position:fixed;inset:0;z-index:9999;background:#e9ebf1;display:flex;flex-direction:column;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif}' +
    '.rpov .rb{background:#1f3a6e;color:#fff;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.rpov .rb b{font-size:15px}.rpov .rb select{padding:6px 8px;border-radius:8px;border:0;max-width:60vw}' +
    '.rpov .rb button{border:0;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;background:#c9a55d;color:#1b2540}.rpov .rb button.g{background:#fff2;color:#fff}.rpov .rb .sp{flex:1}' +
    '.rpov .pk{background:#f4f5f9;padding:8px 14px;border-bottom:1px solid #d9dce6;display:flex;flex-wrap:wrap;gap:6px;align-items:center;max-height:22vh;overflow:auto}' +
    '.rpov .pk label{display:inline-flex;gap:4px;align-items:center;background:#fff;border:1px solid #d3d7e3;border-radius:99px;padding:3px 10px;font-size:13px;cursor:pointer}.rpov .pk label.on{background:#eef2fa;border-color:#1f3a6e;font-weight:700}' +
    '.rpov .vw{flex:1;overflow:auto;padding:12px 8px 40px}.rpov .pgw{margin:0 auto 14px;width:fit-content;box-shadow:0 2px 14px #0003}.rpov .msg{text-align:center;padding:40px 12px;color:#555}' +
    '.rp{width:210mm;height:297mm;box-sizing:border-box;padding:9mm 11mm 8mm;background:#fff;color:#1b2540;font-size:8.6pt;line-height:1.4;display:flex;flex-direction:column;gap:3.2mm;overflow:hidden;position:relative;text-align:left}' +
    '.rp *{box-sizing:border-box}.rp-mut{color:#8a8f9e;font-size:7.6pt}' +
    '.rp-hd{background:#1f3a6e;color:#fff;margin:-9mm -11mm 0;padding:7mm 11mm 5mm;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.2mm solid #c9a55d}' +
    '.rp-br{font-size:7.4pt;letter-spacing:.14em;color:#e0c48a;font-weight:700}.rp-tt{font-size:19pt;font-weight:900;margin-top:1mm}.rp-nm{font-size:17pt;font-weight:900;text-align:right}.rp-nm small{display:block;font-size:7pt;font-weight:600;color:#e0c48a;letter-spacing:.1em}' +
    '.rp-ex{display:flex;align-items:center;gap:2.4mm;margin-top:3.6mm;font-size:10pt;font-weight:800}.rp-ex b{color:#fff;font-size:7.6pt;padding:.7mm 2.4mm;border-radius:99px}.rp-ex em{margin-left:auto;font-style:normal;font-size:8pt;color:#6b7186;font-weight:600}' +
    '.rp-kpi{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:3mm}.rp-kpi>div{border:.3mm solid #e3d3b0;background:#fbf8f0;border-radius:2.4mm;padding:2.6mm 3.4mm;text-align:center}.rp-kpi small{display:block;font-size:7.2pt;color:#7a6a45;font-weight:700}' +
    '.rp-kpi b{display:inline-block;font-size:22pt;font-weight:900;color:#1f3a6e;line-height:1.15;margin-top:.6mm}.rp-kpi b.g{font-size:17pt;padding:.4mm 4mm;border-radius:2mm}.rp-kpi span{display:block;font-size:7.6pt;color:#555;margin-top:.4mm}' +
    '.rp-sec h4{margin:0 0 1.6mm;font-size:9.4pt;color:#1f3a6e;border-left:1.2mm solid #b76e79;padding-left:2mm}.rp-sec h4 small{font-weight:500;color:#8a8f9e;font-size:7pt;margin-left:2mm}' +
    '.rp-row{display:grid;grid-template-columns:1fr 62mm;gap:5mm;align-items:center}.rp-sc{display:flex;height:9mm;border-radius:1.4mm;overflow:hidden}.rp-sc i{display:flex;align-items:center;justify-content:center;font-style:normal;font-size:6.6pt;font-weight:800}' +
    '.rp-scl{position:relative;height:4mm;font-size:6.6pt;color:#555}.rp-scl span{position:absolute;top:.6mm;transform:translateX(-50%);font-weight:700}' +
    '.rp-mk{position:relative;height:15mm}.rp-mk em{position:absolute;top:0;width:0;height:100%;font-style:normal}.rp-mk em:before{content:"";position:absolute;left:-.2mm;top:0;height:5mm;border-left:.4mm solid}.rp-mk em b{position:absolute;white-space:nowrap;transform:translateX(-50%);font-size:7.4pt;font-weight:800;padding:.4mm 1.8mm;border-radius:99px;color:#fff}' +
    '.rp-mk em.m{color:#b76e79;z-index:2}.rp-mk em.m b{background:#b76e79;top:5mm}.rp-mk em.a{color:#7a8094}.rp-mk em.a:before{height:9mm}.rp-mk em.a b{background:#7a8094;top:9mm;opacity:.9}' +
    '.rp-gt{width:100%;border-collapse:collapse;font-size:7.6pt;text-align:center}.rp-gt th{background:#1f3a6e;color:#e0c48a;padding:.9mm;font-size:7pt}.rp-gt td{border-bottom:.2mm solid #e6dcc4;padding:.8mm}.rp-gt td b{display:inline-block;min-width:6mm;border-radius:1mm;padding:.2mm 0}.rp-gt tr.me td{background:#fdf1d8;font-weight:800}' +
    '.rp-two{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.rp-qt{width:100%;border-collapse:collapse;font-size:7.4pt;text-align:center}.rp-qt th{background:#eef2fa;color:#1f3a6e;padding:.8mm;font-size:6.8pt}.rp-qt td{border-bottom:.2mm solid #e8eaf1;padding:.55mm .4mm}.rp-qt td.u{text-align:left;white-space:nowrap;overflow:hidden;max-width:26mm}' +
    '.rp-qt tr.bad td{background:#fdeeee}.rp-qt b.o{color:#2f7d5b}.rp-qt b.x{color:#b84a4a}.rp-qt b.t{color:#c9871e}' +
    '.rp-row2{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.rp-ub{display:grid;grid-template-columns:30mm 1fr 9mm;gap:2mm;align-items:center;font-size:7.6pt;margin-bottom:1mm}.rp-ub small{color:#8a8f9e;margin-left:1mm}.rp-ub .b{height:2.6mm;background:#eceef4;border-radius:99px;overflow:hidden;display:block}.rp-ub .b i{display:block;height:100%}.rp-ub .p{text-align:right;font-weight:800}' +
    '.rp-note{border:.3mm dashed #c9a55d;background:#fffbf1;border-radius:2mm;padding:2.4mm 3mm;line-height:1.7}.rp-note div+div{margin-top:.6mm}' +
    '.rp-ht{width:100%;border-collapse:collapse;font-size:7.6pt;text-align:center}.rp-ht th{background:#1f3a6e;color:#e0c48a;padding:.9mm;font-size:6.8pt}.rp-ht td{border-bottom:.2mm solid #e8eaf1;padding:.8mm .6mm}.rp-ht tr.me td{background:#fdf1d8}.rp-ht td.bar{width:26mm}.rp-ht td.bar i{display:block;height:2.6mm;border-radius:99px}.rp-ht b.gc{display:inline-block;min-width:5mm;border-radius:1mm}' +
    '.rp-hd.sm{padding-bottom:3.5mm}.rp-hd.sm .rp-tt{font-size:15pt}' +
    '.rp-ebs{display:flex;flex-direction:column;gap:3.4mm}.rp-eb{display:flex;gap:4mm;align-items:flex-start;border-bottom:.2mm solid #e8eaf1;padding-bottom:3mm}.rp-ei{flex:none;border:.3mm solid #d9dce6;border-radius:1.4mm;overflow:hidden;background:#fafbff}.rp-ei img{display:block;object-fit:fill}' +
    '.rp-ep{flex:1;min-width:0}.rp-en{font-weight:900;color:#1f3a6e;font-size:9.4pt}.rp-chip{display:inline-block;font-size:6.8pt;padding:.3mm 2mm;border-radius:99px;background:#e6e9f1;color:#555;margin-left:1.4mm;vertical-align:1px}.rp-chip.ok{background:#d9f2e6;color:#1a7a50}.rp-chip.bad{background:#fde1e1;color:#b84a4a}.rp-chip.mid{background:#fff0cf;color:#9a6a00}' +
    '.rp-es b{font-size:18pt;font-weight:900;color:#1f3a6e}.rp-es span{font-size:8pt;color:#666}.rp-eb2{height:2.4mm;background:#eceef4;border-radius:99px;overflow:hidden;margin:1mm 0 1.6mm}.rp-eb2 i{display:block;height:100%}' +
    '.rp-tg{display:flex;flex-wrap:wrap;gap:1mm}.rp-tg span{background:#fde9ec;color:#8a2d4a;font-size:7pt;font-weight:700;padding:.4mm 2mm;border-radius:99px}.rp-ad{font-size:7.4pt;line-height:1.55;color:#444;margin-top:1.2mm}.rp-cm{font-size:7.6pt;color:#1f3a6e;margin-top:1.2mm;background:#eef2fa;border-radius:1.4mm;padding:1mm 2mm}' +
    '.rp-ft{margin-top:auto;font-size:6.6pt;color:#8a8f9e;border-top:.2mm solid #e3d3b0;padding-top:1.6mm}';

  function ensureCss() { if (!document.getElementById('rptcss')) { var s = document.createElement('style'); s.id = 'rptcss'; s.textContent = CSS; document.head.appendChild(s); } }
  function stuList(it) { return ((it && it.all) || []).filter(function (r) { return r.ox && r.score != null; }).sort(function (a, b) { return String(a.name || '').localeCompare(String(b.name || ''), 'ko'); }); }
  function ov() { return document.getElementById('rptOv'); }
  function needEss(L, it) { return L.filter(function (x) { return dd(x) <= dd(it) && ESS[x.m.id] === undefined; }); }
  async function fillImgs(root) {
    var im = [].slice.call(root.querySelectorAll('img.rp-eimg:not([data-done])')), i = 0;
    async function w() { while (i < im.length) { var e = im[i++]; e.setAttribute('data-done', '1'); var a = { exam_id: e.dataset.ex, k: +e.dataset.k }; if (e.dataset.sid) a.sid = e.dataset.sid; var j = await omrApi('eimg', a);
      if (j && j.ok) { await new Promise(function (r) { e.onload = e.onerror = r; e.src = j.src; }); } else { e.removeAttribute('src'); e.parentNode.innerHTML = '<div class="rp-mut" style="padding:4mm;text-align:center">답안 사진이 없어요<br>(선생님께 말씀해 주세요)</div>'; } } }
    await Promise.all([w(), w(), w()]);
  }
  function draw() {
    var o = ov(); if (!o) return; var L = exams(), staff = isStaff();
    var it0 = L.filter(function (x) { return x.m.id === V.ex; })[0] || L[L.length - 1];
    if (it0) { var nd = needEss(L, it0); if (nd.length) { Promise.all(nd.map(essOf)).then(function () { if (ov()) draw(); }); if (!o.querySelector('.vw')) o.innerHTML = '<div class="rb"><b>📄 성적표</b><span class="sp"></span><button class="g" data-rpt="close">닫기</button></div><div class="msg">성적표를 만드는 중…</div>'; return; } }
    if (!L.length) { o.innerHTML = '<div class="rb"><b>성적표</b><span class="sp"></span><button class="g" data-rpt="close">닫기</button></div><div class="msg">아직 채점된 시험이 없어요.</div>'; return; }
    if (!V.ex || L.map(function (x) { return x.m.id; }).indexOf(V.ex) < 0) { var nm = L.filter(function (x) { return msCatOf(x) === '내모미션'; }); V.ex = (nm.length ? nm[nm.length - 1] : L[L.length - 1]).m.id; }
    var it = L.filter(function (x) { return x.m.id === V.ex; })[0];
    var h = '<div class="rb"><b>📄 성적표</b><select data-rpt="ex">' + L.slice().reverse().map(function (x) { return '<option value="' + x.m.id + '"' + (x.m.id === V.ex ? ' selected' : '') + '>' + esc(String(x.ex.name)) + '</option>'; }).join('') + '</select><span class="sp"></span>' +
      (staff ? '<button data-rpt="pdf">PDF 저장 (여백 없음)</button>' : '') + '<button class="g" data-rpt="close">닫기</button></div>';
    var pages = '', cnt = 0, rs = [];
    if (staff) {
      rs = stuList(it);
      h += '<div class="pk"><b style="font-size:13px">학생</b><button data-rpt="all1" style="border:1px solid #1f3a6e;background:#fff;color:#1f3a6e;border-radius:8px;padding:3px 10px;font-weight:700;cursor:pointer">전체 선택</button><button data-rpt="all0" style="border:1px solid #888;background:#fff;color:#555;border-radius:8px;padding:3px 10px;cursor:pointer">전체 해제</button>' +
        rs.map(function (r) { var on = V.sel[r.k] !== false; return '<label class="' + (on ? 'on' : '') + '"><input type="checkbox" data-rpt="chk" data-k="' + esc(r.k) + '"' + (on ? ' checked' : '') + '>' + esc(r.name || r.nick || '') + '</label>'; }).join('') + '</div>';
      rs.forEach(function (r) { if (V.sel[r.k] === false) return; cnt++; pages += pagesHtml(r.name || r.nick || '', r.k, calc(it, r, r.k)); });
      if (!cnt) pages = '<div class="msg">성적표를 만들 학생을 체크해 주세요.</div>';
    } else {
      var row = rowOf(it, null);
      pages = row ? pagesHtml((me().name || '나'), null, calc(it, row, null)) : '<div class="msg">이 회차는 내 기록이 아직 없어요.</div>';
    }
    var keep = o.querySelector('.vw'), top = keep ? keep.scrollTop : 0;
    o.innerHTML = h + '<div class="vw">' + pages + '</div>';
    var vw = o.querySelector('.vw'), z = Math.max(0.62, Math.min(1, (vw.clientWidth - 16) / 794));
    if (z < 1) [].forEach.call(vw.querySelectorAll('.pgw'), function (p) { p.style.zoom = z; });
    vw.scrollTop = top;
    V.imgP = fillImgs(vw);
  }
  function load(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('도구를 불러오지 못했어요(인터넷 연결 확인)')); }; document.head.appendChild(s); }); }
  async function pdf(btn) {
    var o = ov(), pgs = [].slice.call(o.querySelectorAll('.pgw .rp'));
    if (!pgs.length) { alert('성적표를 만들 학생을 체크해 주세요.'); return; }
    var orig = btn.textContent; btn.disabled = true;
    try {
      if (!window.html2canvas) await load('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      if (!(window.jspdf && window.jspdf.jsPDF)) await load('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      btn.textContent = '답안 사진 불러오는 중…'; if (V.imgP) await V.imgP;
      var J = window.jspdf.jsPDF, doc = null;
      for (var i = 0; i < pgs.length; i++) {
        btn.textContent = '찍는 중… (' + (i + 1) + '/' + pgs.length + ')';
        var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-12000px;top:0;width:210mm;height:297mm;overflow:hidden';
        var cl = pgs[i].cloneNode(true); host.appendChild(cl); document.body.appendChild(host);
        var c; try { await new Promise(function (r) { setTimeout(r, 120); }); var rc = host.getBoundingClientRect(); c = await html2canvas(cl, { scale: 2, backgroundColor: '#ffffff', useCORS: true, width: Math.round(rc.width), height: Math.round(rc.height), logging: false }); } finally { host.remove(); }
        if (!doc) doc = new J({ orientation: 'portrait', unit: 'mm', format: [210, 297] }); else doc.addPage([210, 297], 'portrait');
        doc.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
      var it = exams().filter(function (x) { return x.m.id === V.ex; })[0];
      doc.save('공수내모_성적표_' + String(it ? (it.m.short || it.ex.name) : '').replace(/[\\/:*?"<>|]/g, '') + '.pdf');
    } catch (e) { alert('저장 실패: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = orig; }
  }
  window.rptOpen = function () {
    if (!MS || !MS.items) { try { msEnsure(); } catch (e) {} alert('미션을 불러오는 중이에요. 잠깐 뒤에 다시 눌러 주세요.'); return; }
    ensureCss(); var o = ov(); if (o) o.remove(); o = document.createElement('div'); o.id = 'rptOv'; o.className = 'rpov'; document.body.appendChild(o); V.sel = {}; ESS = {}; draw();
  };
  window.rptCard = function () {
    if (!MS || !MS.items || !exams().length) return '';
    var st = isStaff();
    return '<div class="card" style="border-left:4px solid #b76e79;background:#fbf3f4;margin-bottom:12px"><div class="row"><div><b>' + (st ? '성적표 만들기 · PDF 저장' : '내 성적표 보기') + '</b><div class="muted sm">' + (st ? '정오표를 입력하면 바로 만들어져요. 회차를 고르고 학생을 체크해서 여백 없는 A4 PDF로 저장해요.' : '점수 · 등급 · 상위% · 틀린 문제 · 단원별 정답률을 한 장으로 볼 수 있어요.') + '</div></div><span class="sp"></span><button class="btn" data-rpt="open" type="button">' + (st ? '성적표 열기' : '성적표 보기') + '</button></div></div>';
  };
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-rpt]') : null; if (!t) return; var a = t.getAttribute('data-rpt');
    if (a === 'open') { ev.preventDefault(); window.rptOpen(); }
    else if (a === 'close') { var o = ov(); if (o) o.remove(); }
    else if (a === 'pdf') pdf(t);
    else if (a === 'all1' || a === 'all0') { var it = exams().filter(function (x) { return x.m.id === V.ex; })[0]; stuList(it).forEach(function (r) { V.sel[r.k] = a === 'all1'; }); draw(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return; var a = t.getAttribute('data-rpt');
    if (a === 'ex') { V.ex = t.value; draw(); }
    else if (a === 'chk') { V.sel[t.getAttribute('data-k')] = !!t.checked; draw(); }
  });
})();
