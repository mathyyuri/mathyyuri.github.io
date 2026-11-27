/* 공수내모 성적표 — index.html 이 불러 쓰는 부속 파일
   · 학생: 미션 > 성적차트 맨 위 [내 성적표 보기] 또는 누적성적의 각 미션 [📄 성적표 보기] → 회차 성적표(요약·문항별·학습 처방·서술형) + 누적 성적표(동형+과제 세트)를 화면(HTML)으로 봐요.
   · 선생님: 회차·구성 고르고 학생을 체크해서 [PDF 저장] (여백 없는 A4). AI 이해도 분석·학습 처방·지난 회차 대비·최종 한마디·누적 분석 글은 눌러서 고치고 [코멘트 저장](서버 83번 SQL).
   · 등급은 백분위로 계산한 연속 등급(상위 10%=1.00 · 34%=2.00 · 66%=3.00 · 90%=4.00, 사이는 직선) 예: 1.24등급·0.45등급. 점수 분포·등급컷은 해설집 뒷편 '예상 등급표'와 같은 기준이에요.
   index.html 의 전역(MS, msCatOf, msVis, gsmShown, gsmInfo, gsmEval, GSM_ST, isStaff, me, esc, msEnsure)을 가져다 써요. */
(function () {
  window.GSM_UP = {"낙생고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.7,99.7,99.7,99.6,99.1,99.1,99.1,99.1,97.9,97.8,97.8,97.8,96.1,95.5,95.5,95.5,93.8,92.0,91.9,91.9,91.4,87.6,87.1,87.1,87.1,83.3,81.1,81.0,81.0,79.5,74.6,73.9,73.8,73.8,69.0,66.1,65.9,65.9,64.8,58.7,57.6,57.6,57.6,53.5,49.4,49.2,49.2,48.9,42.7,41.0,40.9,40.9,39.0,33.6,33.1,33.1,33.1,28.9,25.8,25.7,25.7,25.5,20.4,19.2,19.1,19.1,18.1,13.8,13.5,13.5,13.5,11.4,8.9,8.8,8.8,8.8,6.3,5.3,5.3,5.3,5.3,3.0,2.8,2.8,2.8,2.7,1.2,1.1,1.1,1.1,1.0,0.3,0.3],"늘푸른고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.7,99.7,99.7,99.5,99.3,99.3,99.3,98.8,98.5,98.4,98.4,97.5,97.1,97.0,96.7,95.6,95.0,94.8,94.3,92.8,91.9,91.5,90.9,89.1,87.9,87.2,86.6,84.5,82.8,81.7,81.2,79.1,76.8,75.1,74.3,72.8,70.5,68.1,66.7,65.6,63.6,61.0,58.7,57.5,56.3,53.9,51.1,49.1,48.0,46.6,44.1,41.4,39.5,38.5,37.2,34.7,32.1,30.4,29.7,28.5,26.2,23.6,22.1,21.6,20.9,18.8,16.4,15.0,14.6,14.2,12.8,10.7,9.4,8.9,8.8,7.9,6.3,5.1,4.8,4.7,4.7,3.2,2.4,2.0,1.9,1.9,1.9,0.7,0.5,0.5],"돌마고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.7,99.6,99.6,99.6,99.3,99.0,98.9,98.9,98.6,97.9,97.7,97.7,97.4,96.2,95.8,95.7,95.6,93.9,93.0,92.8,92.8,91.3,89.4,89.0,88.9,88.1,85.2,84.0,83.7,83.6,80.7,78.3,77.5,77.3,76.2,72.2,70.4,69.8,69.8,66.4,63.2,61.6,61.3,60.7,56.3,53.6,52.4,52.3,50.2,46.4,43.7,43.1,43.0,39.8,36.6,34.2,33.9,33.7,30.5,27.2,25.6,25.5,24.8,22.6,19.0,18.2,18.2,17.2,15.5,12.3,12.0,12.0,11.3,9.2,7.4,7.3,7.2,6.7,4.9,4.0,4.0,3.9,3.3,2.2,1.8,1.8,1.8,1.4,0.6,0.5],"보라고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.6,99.6,99.6,99.3,98.9,98.9,98.9,98.5,97.7,97.6,97.6,97.3,95.7,95.4,95.3,95.2,92.9,92.1,92.0,91.8,89.7,87.9,87.5,87.1,86.2,82.7,81.8,81.2,80.8,77.3,75.5,74.5,73.6,72.1,68.5,67.2,65.8,65.1,61.8,59.9,58.2,56.7,55.3,52.5,50.7,48.7,47.5,45.2,43.6,41.5,39.6,38.1,36.1,34.7,32.6,31.2,29.4,28.2,26.5,24.7,23.1,21.6,20.7,19.4,18.1,16.0,15.1,14.3,13.2,12.3,10.6,10.1,9.4,8.3,7.4,6.5,6.2,5.8,4.7,3.8,3.6,3.4,3.0,2.4,1.8,1.7,1.6,0.8,0.8],"보평고":[100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.8,99.2,99.2,99.2,99.2,97.8,97.7,97.7,97.7,95.7,95.3,95.1,95.0,92.8,91.8,91.3,91.2,89.2,87.4,86.4,86.1,84.8,82.5,80.9,80.2,79.6,77.2,74.9,73.4,72.9,71.4,68.9,66.7,65.5,64.8,62.9,60.3,58.2,57.2,56.2,54.2,51.5,49.6,48.8,47.7,45.6,43.0,41.3,40.6,39.5,37.4,35.0,33.4,32.8,32.0,29.9,27.6,26.2,25.7,25.0,23.1,21.0,19.7,19.4,18.8,17.2,15.3,14.2,13.9,13.6,12.2,10.4,9.5,9.4,9.2,8.2,6.6,5.8,5.7,5.7,5.1,3.7,3.1,3.0,3.0,2.8,1.8,1.3,1.3,1.3,1.3,0.6,0.4,0.3],"분당고":[100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.5,99.1,99.1,99.1,98.7,97.7,97.4,97.4,97.4,95.5,94.8,94.7,94.7,92.9,91.1,90.7,90.6,89.8,87.1,85.8,85.6,85.4,83.1,80.3,79.5,79.4,78.5,75.2,72.9,72.4,72.3,70.5,66.9,65.1,64.8,64.6,61.8,58.3,57.0,56.9,56.4,52.9,49.8,48.9,48.9,48.1,44.3,41.7,41.1,41.0,39.9,36.0,33.9,33.6,33.5,32.2,28.6,26.9,26.6,26.6,25.2,21.9,20.5,20.3,20.3,18.9,16.0,14.9,14.8,14.8,13.6,11.0,10.1,10.0,10.0,9.1,6.9,6.3,6.2,6.2,5.8,4.0,3.4,3.4,3.4,3.4,1.8,1.5,1.5,1.5,1.5,0.6,0.4,0.4],"분당대진고":[100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.5,99.5,99.5,99.5,98.5,98.3,98.2,98.2,98.2,96.1,95.7,95.5,95.5,93.4,92.8,91.5,91.2,90.7,88.5,86.3,85.5,85.4,83.8,82.0,79.1,78.5,78.0,76.2,73.4,70.9,70.4,69.4,68.0,64.2,62.6,61.6,60.3,59.0,55.2,54.2,52.3,51.4,49.3,46.6,45.7,43.4,42.8,40.3,38.6,37.0,35.1,34.6,32.3,31.3,29.0,27.6,27.0,25.2,24.6,22.0,21.0,20.3,19.0,18.5,15.9,15.4,14.4,13.7,13.0,11.0,10.7,9.8,9.3,8.6,7.2,6.9,6.0,5.8,5.3,4.4,3.9,3.2,3.1,2.7,2.4,2.0,1.4,1.4,1.4,1.1,0.7,0.4,0.4],"불곡고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.8,99.7,99.7,99.5,99.4,99.3,99.1,98.9,98.8,98.6,98.2,97.9,97.7,97.3,96.9,96.6,96.2,95.6,95.0,94.7,94.1,93.3,92.7,92.2,91.3,90.4,89.6,89.0,87.9,86.8,86.0,85.2,83.8,82.4,81.6,80.5,78.9,77.4,76.4,75.1,73.2,71.5,70.4,69.0,67.0,65.0,63.8,62.5,60.2,57.9,56.6,55.3,52.9,50.3,48.7,47.8,45.4,42.4,40.5,39.8,37.7,34.4,32.3,31.5,30.2,27.0,24.4,23.3,22.9,20.4,17.5,16.0,15.6,14.6,11.9,10.1,9.4,9.3,7.7,5.8,5.0,4.8,4.7,3.4,2.3,2.0,1.9,1.9,1.1,0.6,0.5],"서천고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.6,99.6,99.5,99.5,99.2,99.1,99.0,98.9,98.6,98.4,98.1,97.9,97.6,97.2,96.8,96.5,96.1,95.6,94.9,94.4,94.0,93.5,92.5,91.4,91.0,90.4,89.4,87.8,86.8,86.3,85.6,83.4,81.7,80.9,80.2,78.6,75.8,74.2,73.6,72.9,69.6,66.7,65.4,64.7,63.4,59.3,56.7,55.5,54.8,52.4,48.7,45.9,44.8,44.1,41.5,37.6,35.0,34.1,33.4,30.6,27.4,25.0,24.1,23.3,21.2,17.9,16.4,15.6,14.7,13.5,10.6,9.9,9.2,7.9,7.2,5.7,5.3,5.0,3.4,3.0,2.4,2.4,2.3,1.1,0.7,0.7],"서현고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.8,99.5,99.4,99.4,99.4,99.0,98.7,98.7,98.7,98.1,97.6,97.5,97.5,96.8,95.8,95.6,95.5,94.9,93.5,92.8,92.7,92.4,90.6,89.3,88.9,88.9,87.3,85.0,84.2,84.0,83.4,80.4,78.4,78.0,77.9,75.7,72.2,70.9,70.8,70.3,66.5,63.4,62.7,62.6,61.1,56.3,54.0,53.6,53.6,50.6,45.8,44.3,44.1,44.1,39.8,35.8,34.9,34.8,34.8,29.5,26.3,25.8,25.8,25.8,20.3,17.9,17.6,17.6,17.6,12.7,11.0,10.8,10.8,10.8,6.9,5.8,5.7,5.7,5.7,3.1,2.4,2.4,2.4,2.4,1.1,0.6,0.6],"송림고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.7,99.6,99.6,99.6,99.2,99.2,99.2,98.7,98.4,98.4,98.4,97.3,97.1,97.1,96.7,95.3,95.2,95.2,93.7,92.5,92.5,92.4,89.6,88.8,88.8,88.3,84.6,84.1,84.1,82.6,78.7,78.4,78.2,75.4,71.9,71.6,71.3,67.2,64.3,64.0,63.4,58.6,56.1,55.8,54.8,49.5,47.7,47.1,45.8,40.8,39.3,38.5,36.9,32.6,31.5,30.5,28.5,25.2,24.3,23.1,20.9,18.8,17.9,16.7,14.5,13.3,12.5,11.3,9.7,9.2,8.2,7.2,6.1,5.7,4.9,4.3,4.0,3.4,2.6,2.1,2.0,1.7,1.6,1.1,0.9,0.5,0.4],"수내고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.7,99.7,99.7,99.7,99.7,99.1,99.0,99.0,99.0,99.0,97.7,97.7,97.7,97.7,97.2,95.4,95.4,95.4,95.4,93.9,92.0,92.0,92.0,92.0,89.4,87.5,87.5,87.5,87.5,83.8,81.8,81.8,81.8,81.8,77.2,75.0,75.0,75.0,75.0,69.7,67.3,67.3,67.3,67.3,61.6,58.9,58.9,58.9,58.9,53.2,50.1,50.1,50.1,50.1,44.8,41.4,41.4,41.4,41.4,36.9,32.8,32.8,32.8,32.8,29.3,24.6,24.6,24.6,24.6,22.4,17.4,17.3,17.3,17.3,16.4,11.2,11.1,11.1,11.1,10.9,6.3,6.2,6.2,6.2,6.2,2.9,2.7,2.7,2.7,2.7,1.2,0.7,0.7],"신갈고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.8,99.5,99.5,99.5,99.5,99.1,98.8,98.8,98.8,98.8,97.6,97.5,97.5,97.5,96.0,95.5,95.5,95.5,94.9,92.8,92.7,92.7,92.7,89.4,88.8,88.8,88.8,87.2,83.8,83.7,83.7,83.7,78.2,77.4,77.4,77.4,74.7,69.8,69.8,69.8,69.8,62.5,61.1,61.1,61.1,58.7,51.9,51.8,51.8,51.8,44.5,42.0,42.0,42.0,41.2,33.0,32.6,32.6,32.6,28.3,23.9,23.8,23.8,23.8,17.4,16.3,16.3,16.3,16.0,10.5,10.3,10.3,10.3,8.4,5.9,5.9,5.9,5.9,3.5,2.9,2.9,2.9,2.9,1.2,1.2,1.2,1.2,1.2,0.3,0.3],"야탑고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.6,99.5,99.5,99.5,99.0,98.9,98.9,98.8,98.2,97.8,97.7,97.7,97.1,96.3,96.1,95.9,95.7,94.3,93.8,93.5,93.4,92.1,91.0,90.5,90.1,89.4,87.6,86.8,86.1,85.8,83.9,82.6,81.5,80.8,80.0,77.9,76.6,75.3,74.7,72.6,71.3,69.4,68.2,67.3,65.2,63.4,61.5,60.7,58.6,57.4,55.1,53.5,52.0,50.2,48.3,46.2,45.2,42.7,41.8,39.6,38.0,35.8,34.0,32.9,30.9,30.1,26.8,26.0,24.2,23.1,21.2,19.2,18.8,16.5,16.1,13.6,12.8,11.4,10.0,9.9,8.1,7.8,5.1,4.8,4.8,4.2,4.1,1.4,1.4],"영덕여고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.8,99.8,99.8,99.8,99.4,99.4,99.4,99.4,98.7,98.5,98.5,98.5,97.8,97.1,97.1,96.9,96.7,95.0,94.9,94.7,94.5,92.6,91.9,91.8,91.2,90.3,88.1,87.9,87.0,86.7,84.0,83.1,82.6,81.3,80.1,77.6,77.4,75.3,74.7,72.0,71.0,69.8,67.5,66.8,64.1,63.8,60.5,59.4,57.6,56.1,55.2,51.3,51.0,48.3,47.8,44.6,42.7,41.9,39.6,39.4,35.0,34.5,32.4,31.1,29.8,26.9,26.8,23.5,23.1,20.9,19.9,18.7,16.0,16.0,14.0,13.8,11.2,10.0,9.9,8.8,8.8,5.6,5.3,5.3,4.8,4.8,2.2,2.2,2.2,2.1,2.1,0.6,0.6],"운중고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.8,99.5,99.4,99.4,99.3,99.0,98.8,98.7,98.6,98.0,97.8,97.6,97.5,96.7,96.2,95.9,95.8,94.9,94.2,93.7,93.4,92.6,91.6,90.8,90.3,89.6,88.4,87.3,86.5,85.8,84.6,83.3,81.9,81.2,80.0,78.5,77.0,75.7,74.6,73.3,71.3,69.6,68.5,67.1,65.5,63.3,61.5,60.3,59.0,56.7,54.4,52.6,51.5,50.3,47.5,44.8,43.2,42.2,40.9,38.2,35.0,33.6,33.0,31.4,28.6,25.4,24.4,24.0,22.8,19.4,16.7,16.1,15.9,15.1,12.0,9.4,9.0,9.0,8.5,6.0,4.1,4.0,4.0,4.0,1.7,1.1,1.1],"이매고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.6,99.6,99.6,99.4,99.0,98.9,98.9,98.8,97.9,97.7,97.7,97.7,96.3,95.8,95.8,95.8,94.6,93.4,93.1,93.1,92.4,90.4,89.6,89.5,89.5,87.0,85.5,84.9,84.8,83.6,80.9,79.5,79.3,79.3,76.5,73.9,73.1,73.0,72.0,68.7,66.3,66.0,65.9,63.9,59.8,58.5,58.3,58.0,54.6,51.0,50.3,50.2,49.5,44.9,42.4,42.1,42.1,40.6,35.6,34.0,33.9,33.9,30.9,26.9,26.2,26.1,26.1,22.6,19.2,18.9,18.9,18.9,14.5,12.7,12.6,12.6,12.3,8.0,7.3,7.3,7.3,7.3,3.5,3.4,3.4,3.4,2.6,1.0,0.9],"태원고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.8,99.8,99.8,99.8,99.6,99.5,99.5,99.5,99.1,99.0,99.0,99.0,98.5,98.2,98.2,98.1,97.4,97.0,96.9,96.8,95.9,95.3,95.2,95.0,94.0,93.1,92.8,92.7,91.6,90.3,89.8,89.6,88.6,86.8,86.0,85.7,84.8,82.8,81.5,81.0,80.4,78.3,76.4,75.5,75.0,73.2,70.7,69.3,68.7,67.5,64.8,62.7,61.7,61.0,58.5,55.9,54.3,53.6,52.2,49.1,46.7,45.4,45.0,42.7,39.6,37.4,36.6,35.7,33.0,30.2,28.4,28.1,26.4,23.9,21.0,20.0,19.8,18.0,15.2,12.9,12.6,12.2,11.0,7.5,6.5,6.5,6.0,4.9,2.3,2.1],"판교고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.7,99.7,99.7,99.4,99.2,99.2,99.2,98.6,98.3,98.3,98.3,97.2,96.6,96.5,96.5,95.2,94.2,93.9,93.9,92.6,90.8,90.2,90.1,89.4,86.9,85.5,85.1,85.1,82.5,80.1,79.1,78.9,78.0,74.6,72.4,71.8,71.7,69.4,65.8,64.2,64.0,63.6,60.2,56.8,55.7,55.6,54.9,50.6,47.8,47.2,47.2,46.0,41.2,39.2,38.8,38.8,37.1,32.5,31.0,30.8,30.8,28.6,24.4,23.5,23.4,23.4,20.8,17.4,16.8,16.7,16.7,14.1,11.4,11.1,11.1,11.1,8.5,6.6,6.5,6.5,6.5,4.5,3.1,3.0,3.0,3.0,1.5,0.9,0.9],"한솔고":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,99.9,99.9,99.9,99.9,99.8,99.8,99.8,99.6,99.5,99.5,99.4,99.1,99.0,98.9,98.6,98.2,98.1,97.9,97.4,96.9,96.7,96.4,95.6,95.0,94.8,94.1,93.1,92.5,92.0,91.3,90.0,89.2,88.6,87.8,86.4,85.3,84.4,83.4,81.9,80.8,79.7,78.4,77.0,75.6,74.3,72.7,71.5,69.8,68.4,66.6,65.3,63.5,61.9,60.2,58.5,56.9,55.1,53.6,51.6,50.2,47.9,46.4,44.7,43.3,40.9,39.2,37.8,35.8,34.1,31.7,30.6,28.7,27.7,24.9,23.6,22.1,20.4,18.6,17.0,16.5,13.7,13.1,11.3,10.7,8.7,7.0,6.1,5.9,5.9,2.6,2.3]};
  var GC = ['', '#2a4234', '#51705a', '#86987a', '#c0b494', '#e4dcc6'], GT = ['', '#fff', '#fff', '#fff', '#262a24', '#262a24'];
  var NAVY = '#2f4a3c', ROSE = '#9a8450', GOLD = '#b5a58a', CATS = ['내모미션', '과제미션', '원본미션'];
  var V = { ex: null, sel: {}, open: false, mode: 'both' };
  var SCHC = { '태원고': 'tw', '한솔고': 'hs', '서현고': 'sh', '야탑고': 'yt', '돌마고': 'dm', '수내고': 'sn' };
  var GSM_LV = {"tw1": "11121211121323233333123", "tw1h": "11121211121323233333123", "hs2": "11112123313222333333233", "hs2h": "11112123313222333333233", "sh3": "1111122222233333333333", "sh3h": "1111122222233333333333", "yt4": "111122232333333333333", "yt4h": "111122232333333333333", "dm5": "111112222333333333323", "dm5h": "111112222333333333323", "sn6": "11111223233333333332", "sn6h": "11111223233333333332"};
  var LVN = ['', '하', '중', '상'], LVC = ['', '#6b7a5e', '#a8904f', '#a63d40'];
  var FIELDS = { und: 'AI 이해도 분석', rx: '학습 처방', cmp: '지난 회차 대비', fin: '선생님 최종 한마디', cum: '누적 분석' };

  var ESS = {}, NT = {}, DR = {}, TAGS = [['skip', '풀이 과정 생략', '풀이 과정을 한 줄씩 빠짐없이 쓰는 연습이 필요해요(과정 점수가 따로 있어요).'],
    ['calc', '계산 실수', '계산 과정을 줄 맞춰 쓰고 마지막에 반드시 검산하세요.'], ['cond', '조건 누락', '문제의 조건을 먼저 표시하고, 풀이에서 모두 사용했는지 확인하세요.'],
    ['concept', '개념·공식 오류', '관련 개념과 공식을 정확히 쓰고 적용하는 연습이 필요해요.'], ['ans', '답만 기재', '답만 쓰지 말고, 근거가 되는 식을 반드시 함께 쓰세요.'],
    ['part', '부분점수만', '마지막 단계까지 끝내는 연습이 필요해요(끝까지 푸는 습관).'], ['mark', '표기·서술 부정확', '수학 기호와 용어를 정확히 쓰고, 문장으로도 풀이를 연결하세요.'],
    ['time', '시간 부족·미완성', '서술형은 쉬운 것부터 시간 배분을 정해 푸는 연습이 필요해요.']];
  function tagOf(id) { for (var i = 0; i < TAGS.length; i++) if (TAGS[i][0] === id) return TAGS[i]; return null; }
  async function callApi(fn, a, args) { try { var r = await fetch(API_URL.replace('ac_api', fn), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: API_KEY, Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify({ p_action: a, p_token: TOKEN, p_args: args || {} }) }); return r.ok ? await r.json() : { ok: false, error: 'HTTP ' + r.status }; } catch (e) { return { ok: false, error: String(e && e.message || e) }; } }
  function omrApi(a, args) { return callApi('ac_omr', a, args); }
  async function essOf(it) {
    var id = it.m.id; if (ESS[id] !== undefined) return ESS[id];
    var j = await omrApi('emeta', { exam_id: id }), o = null;
    if (j && j.ok && (j.es_max || []).length) { o = { max: j.es_max.map(Number), rows: {} }; (j.rows || []).forEach(function (r) { o.rows[r.sid] = r; }); }
    ESS[id] = o; return o;
  }
  async function notesOf(id) {
    if (NT[id] !== undefined) return NT[id];
    var j = await callApi('ac_rptn', 'get', { exam_id: id }), o = {};
    if (j && j.ok) (j.rows || []).forEach(function (r) { o[r.sid] = r.f || {}; });
    NT[id] = o; return o;
  }
  function savedF(id, key, f) { var o = NT[id] || {}, row = key ? o[key] : o[Object.keys(o)[0]]; return row && row[f] != null ? row[f] : null; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function pc(g, t) { return t ? Math.round(g / t * 100) : null; }
  function kindOf(it) { var c = msCatOf(it); return c === '과제미션' ? '과제' : c === '원본미션' ? '원본' : '동형'; }
  function kindCol(k) { return k === '과제' ? '#9a8450' : k === '원본' ? '#6b7a5e' : NAVY; }
  function dd(it) { return String(it.ex.date || '').slice(0, 10); }
  /* 내신 5등급제 백분위 → 연속 등급: 상위 10%=1.00 · 34%=2.00 · 66%=3.00 · 90%=4.00 · 100%=5.00 (사이는 직선으로 이어서 1.24등급·0.45등급처럼 표시) */
  function cgrade(top) {
    var P = [[0, 0], [10, 1], [34, 2], [66, 3], [90, 4], [100, 5]]; top = Math.max(0, Math.min(100, +top));
    for (var i = 0; i < 5; i++) if (top <= P[i + 1][0]) return P[i][1] + (P[i + 1][1] - P[i][1]) * (top - P[i][0]) / (P[i + 1][0] - P[i][0]);
    return 5;
  }
  function gfmt(g) { return (Math.round(g * 100) / 100).toFixed(2); }
  function exams() {
    if (!MS || !MS.items) return [];
    return MS.items.filter(function (it) { return (V.any || msVis(it)) && CATS.indexOf(msCatOf(it)) >= 0 && gsmShown(it) && it.roster && it.roster.length; })
      .sort(function (a, b) { return dd(a).localeCompare(dd(b)) || String(a.ex.name).localeCompare(String(b.ex.name), 'ko'); });
  }
  function rowOf(it, key) {
    var rs = (isStaff() ? it.all : it.roster) || [];
    for (var i = 0; i < rs.length; i++) { var r = rs[i]; if (r.ox && r.score != null && (isStaff() ? r.k === key : r.me)) return r; }
    return null;
  }
  function totalOf(it) { return r1((it.ex.items || []).reduce(function (a, x) { return a + (+x.pts || 1); }, 0)) || 100; }
  function essFor(it, key) {
    var eo = ESS[it.m.id]; if (!eo) return null; var sr = null;
    if (isStaff()) sr = eo.rows[key] || null; else { var ks = Object.keys(eo.rows); sr = ks.length ? eo.rows[ks[0]] : null; }
    var mx = r1(eo.max.reduce(function (a, b) { return a + b; }, 0)), graded = !!(sr && sr.es_total != null);
    var cl = null, rows = Object.keys(eo.rows).map(function (k) { return eo.rows[k]; }).filter(function (r) { return r.es_total != null; });
    if (rows.length > 1) cl = eo.max.map(function (m, q) { var s = 0, c = 0; rows.forEach(function (r) { if (r.es && r.es[q] != null) { s += +r.es[q] / m; c++; } }); return c ? Math.round(s / c * 100) : null; });
    return { max: eo.max, mx: mx, got: (sr && sr.es) || [], tags: (sr && sr.tags) || [], total: graded ? +sr.es_total : null, graded: graded, has: !!sr, sid: sr && sr.sid, ks: (sr && sr.ks) || [], hw: (sr && sr.hw) || {}, ex: it.m.id, cl: cl };
  }
  function lvStr(inf, kind) { if (kind === '원본') return null; var c = SCHC[inf.school]; return c ? (GSM_LV[c + inf.n + (kind === '과제' ? 'h' : '')] || null) : null; }
  function cv(ch) { return ch === 'O' ? 1 : ch === 'T' ? .5 : ch === 'X' ? 0 : null; }
  function calc(it, row, key) {
    var inf = gsmInfo(it), kind = kindOf(it), sc = r1(+row.score), ex = it.ex, items = ex.items || [], es = essFor(it, key), objTot = totalOf(it);
    var peers = it.roster.filter(function (r) { return r.score != null; }), n = peers.length, rk = 1, sum = 0;
    peers.forEach(function (r) { if (+r.score > +row.score) rk++; sum += +r.score; });
    var ev = gsmEval(inf.school, sc), st = GSM_ST[inf.school] || null, ox = String(row.ox || ''), ls = lvStr(inf, kind), derived = !ls;
    var rows = items.map(function (x, i) {
      var g = 0, t = 0; it.roster.forEach(function (r) { var v = cv(String(r.ox || '').charAt(i)); if (v != null) { g += v; t++; } });
      var cr = t ? Math.round(g / t * 100) : null, lv = ls ? +ls.charAt(i) || 0 : (cr == null ? 0 : cr >= 80 ? 1 : cr >= 50 ? 2 : 3);
      return { i: i, no: x.no || (i + 1), unit: x.unit || '', sub: x.sub || '', typ: x.typ || '객관식', pts: +x.pts || 0, c: ox.charAt(i) || '', cr: cr, lv: lv };
    });
    var lvs = { 1: { g: 0, t: 0, cg: 0, ct: 0, w: [] }, 2: { g: 0, t: 0, cg: 0, ct: 0, w: [] }, 3: { g: 0, t: 0, cg: 0, ct: 0, w: [] } };
    var un = {}, order = [];
    rows.forEach(function (q) {
      var mv = cv(q.c);
      if (q.lv && mv != null) { lvs[q.lv].g += mv; lvs[q.lv].t++; if (q.c !== 'O') lvs[q.lv].w.push(q.no); }
      it.roster.forEach(function (r) { var v = cv(String(r.ox || '').charAt(q.i)); if (q.lv && v != null) { lvs[q.lv].cg += v; lvs[q.lv].ct++; } });
      if (!q.unit) return;
      if (!un[q.unit]) { un[q.unit] = { u: q.unit, t: 0, g: 0, cg: 0, ct: 0, lost: 0, bad: [], subs: {}, pts: 0 }; order.push(q.unit); }
      var o = un[q.unit]; o.pts += q.pts;
      if (mv != null) { o.t++; o.g += mv; if (mv < 1) { o.lost += q.pts * (1 - mv); o.bad.push(q); } }
      it.roster.forEach(function (r) { var v = cv(String(r.ox || '').charAt(q.i)); if (v != null) { o.cg += v; o.ct++; } });
      if (q.sub) { var sb = o.subs[q.sub] = o.subs[q.sub] || { s: q.sub, nos: [], bad: [] }; sb.nos.push(q.no); if (mv != null && mv < 1) sb.bad.push(q.no); }
    });
    var tp = ev ? ev.top : null;
    return { it: it, key: key, inf: inf, kind: kind, sc: sc, es: es, objTot: objTot, obj: es && es.graded ? r1(sc - es.total) : sc, tot: es && es.graded ? r1(objTot + es.mx) : objTot, n: n, rk: rk, avg: n ? r1(sum / n) : null, ev: ev, st: st,
      rows: rows, un: un, order: order, lvs: lvs, derived: derived, ls: ls, tp: tp, cg: tp == null ? null : cgrade(tp), cuts: st ? st.slice(2, 6) : null, nm: ex.name, date: dd(it), nn: inf.n };
  }
  function upperAt(school, s) { var e = gsmEval(school, s); return e ? e.top : null; }
  function gtxt(d) { return d.cg == null ? '-' : gfmt(d.cg); }
  function topTxt(t) { return t == null ? '-' : t < 1 ? '1% 이내' : (t < 10 ? (Math.round(t * 10) / 10) : Math.round(t)) + '%'; }
  function arrow(v, u, inv) { if (v == null || isNaN(v)) return ''; var z = Math.abs(v) < 0.05; return '<b class="' + (z ? 'zz' : ((v > 0) !== !!inv ? 'up' : 'dn')) + '">' + (z ? '–' : (v > 0 ? '▲' : '▼')) + ' ' + Math.abs(Math.round(v * 10) / 10) + (u || '') + '</b>'; }
  function lvRate(d, l) { var o = d.lvs[l]; return { me: o.t ? pc(o.g, o.t) : null, cl: o.ct ? pc(o.cg, o.ct) : null, t: o.t, w: o.w }; }
  function unRate(o) { return { me: o.t ? pc(o.g, o.t) : null, cl: o.ct ? pc(o.cg, o.ct) : null }; }
  function weakList(d) {
    return d.order.map(function (u) { return d.un[u]; }).filter(function (o) { return o.lost > 0; }).sort(function (a, b) { return b.lost - a.lost || (unRate(a).me - unRate(b).me); });
  }
  /* 같은 종류(동형/과제/원본)의 바로 이전 회차 기록 */
  function prevOf(d) {
    var best = null;
    exams().forEach(function (it) {
      if (it === d.it || kindOf(it) !== d.kind) return; var i2 = gsmInfo(it);
      var before = d.kind === '원본' ? dd(it) < d.date : (i2.n && d.nn ? i2.n < d.nn : dd(it) < d.date);
      if (!before) return; var row = rowOf(it, d.key); if (!row) return;
      if (!best || (d.kind === '원본' ? dd(it) > dd(best.it) : i2.n > best.nn)) best = { it: it, row: row, nn: i2.n };
    });
    return best ? calc(best.it, best.row, d.key) : null;
  }

  /* ───────── 자동 문구(선생님이 고칠 수 있어요) ───────── */
  function genUnd(d) {
    var L = [], ev = d.ev, diff = d.avg != null ? r1(d.sc - d.avg) : null;
    L.push('이번 ' + (d.kind === '과제' ? '과제' : d.kind === '원본' ? '원본 시험' : '동형 모의고사') + '에서 ' + d.sc + '점' + (d.cg != null ? '(예상 ' + gtxt(d) + '등급 · 상위 ' + topTxt(d.tp) + ')' : '') + '을 받았고, 반 평균(' + (d.avg == null ? '-' : d.avg) + '점)보다 ' + (diff == null ? '' : diff >= 0 ? diff + '점 높아요.' : Math.abs(diff) + '점 낮아요.'));
    var a = lvRate(d, 1), b = lvRate(d, 2), c = lvRate(d, 3), src = d.derived ? '(반 정답률로 나눈 난이도 기준) ' : '';
    if (a.me != null || b.me != null || c.me != null) {
      var s = src + '난이도별 정답률은 하 ' + (a.me == null ? '-' : a.me + '%') + ' · 중 ' + (b.me == null ? '-' : b.me + '%') + ' · 상 ' + (c.me == null ? '-' : c.me + '%') + '예요. ';
      if (a.me != null && a.me < 80) s += '기본(하) 문항에서 점수가 새고 있어서, 새로운 유형보다 <개념·계산의 정확도>를 먼저 다지는 단계예요.';
      else if (b.me != null && b.me < 65) s += '기본 문항은 안정적이지만 중간 난이도에서 흔들려요. 개념을 문제에 적용하는 연습(필수 유형)이 가장 효과적이에요.';
      else if (c.me != null && c.me < 45) s += '하·중 난이도는 안정적이에요. 이제 점수를 올리려면 상 난이도의 발상·풀이 설계 연습이 필요해요.';
      else if (a.me != null && b.me != null && a.me >= 80 && b.me >= 65 && (c.me == null || c.me >= 45)) s += '난이도 전반에서 고르게 잘 풀었어요. 현재 이해도는 안정권이에요.';
      else s += '난이도별로 큰 편차 없이 풀고 있어요.';
      L.push(s.replace(/[<>]/g, ''));
    }
    var wk = weakList(d), good = d.order.map(function (u) { return d.un[u]; }).filter(function (o) { return o.t >= 2 && o.lost === 0; });
    if (good.length) L.push('「' + good.map(function (o) { return o.u; }).join('·') + '」 단원은 틀린 문항이 없어 이해가 잘 되어 있어요.');
    if (wk.length) { var w = wk[0], r = unRate(w); L.push('가장 보완이 필요한 단원은 「' + w.u + '」(내 ' + r.me + '% · 반 ' + r.cl + '%)이고, ' + (w.bad.length ? w.bad.map(function (q) { return q.no; }).join('·') + '번에서 점수를 잃었어요.' : '')); }
    var careless = d.rows.filter(function (q) { return q.c === 'X' && q.cr != null && q.cr >= 70; }), hard = d.rows.filter(function (q) { return q.c === 'X' && q.cr != null && q.cr < 40; });
    if (careless.length) L.push('반 친구 대부분이 맞힌 ' + careless.map(function (q) { return q.no; }).join('·') + '번을 놓쳤어요. 개념을 몰라서라기보다 조건 읽기·계산 실수일 가능성이 커요.');
    if (hard.length) L.push('반에서도 정답률이 낮았던 ' + hard.map(function (q) { return q.no; }).join('·') + '번은 감점 부담이 작아요. 해설로 발상만 정리하면 충분해요.');
    if (d.es && d.es.graded) { var rt = d.es.mx ? Math.round(d.es.total / d.es.mx * 100) : 0, ot = d.objTot ? Math.round(d.obj / d.objTot * 100) : 0; L.push('서술형은 ' + d.es.total + '/' + d.es.mx + '점(' + rt + '%)으로 ' + (rt < ot - 5 ? '객관식(' + ot + '%)보다 낮아요. 아는 문제도 풀이 과정을 끝까지 쓰는 연습이 필요해요.' : rt >= 85 ? '아주 잘 썼어요.' : '무난해요.')); }
    return L.join('\n');
  }
  function actFor(o, d) {
    var s = [], subs = Object.keys(o.subs).map(function (k) { return o.subs[k]; }).filter(function (x) { return x.bad.length; }).map(function (x) { return x.s; });
    var easyMiss = o.bad.filter(function (q) { return q.cr != null && q.cr >= 70; }), lowLv = o.bad.filter(function (q) { return q.lv && q.lv <= 2; });
    var r = unRate(o);
    if (r.me != null && r.me < 50) s.push('교과서 예제 → 필수 유형 순서로 개념부터 다시 정리');
    else if (easyMiss.length) s.push('아는 개념이니 조건 표시·계산 검산 습관을 점검');
    else if (lowLv.length) s.push('개념 적용 연습(같은 유형 3~5문항)');
    else s.push('해설을 읽고 핵심 발상을 한 줄로 정리한 뒤 변형 문제로 재도전');
    return { subs: subs, act: s.join(' · ') };
  }
  function genRx(d) {
    var L = [], wk = weakList(d).slice(0, 3);
    wk.forEach(function (o, i) { var a = actFor(o, d); L.push((i + 1) + '. 「' + o.u + '」 ' + (a.subs.length ? '— ' + a.subs.join(', ') + ' · ' : '— ') + a.act + ' (다시 볼 문항: ' + o.bad.map(function (q) { return q.no; }).join('·') + '번)'); });
    if (!wk.length) L.push('1. 틀린 문항이 없어요! 다음 회차에는 상 난이도 문항을 먼저 시도해 보며 시간 배분을 연습해요.');
    var c = lvRate(d, 3), a = lvRate(d, 1);
    if (a.me != null && a.me < 80) L.push((wk.length + 1) + '. 기본(하) 문항에서 실수가 나왔어요. 풀이를 한 줄씩 쓰고 마지막에 반드시 검산해요.');
    else if (c.me != null && c.me < 45 && d.sc >= 60) L.push((wk.length + 1) + '. 상 난이도는 시간을 정해 두고(문항당 6~7분) 막히면 표시 후 넘어가는 연습을 해요.');
    if (d.ev && d.cuts && d.ev.grade > 1) { var gap = r1(d.cuts[d.ev.grade - 2] - d.sc); if (gap > 0) L.push('· 다음 등급 구간(' + (d.ev.grade - 1) + '등급)까지 ' + gap + '점 — 틀린 문항 중 반 정답률이 높았던 문제부터 되찾으면 가장 빨라요.'); }
    var bad = d.rows.filter(function (q) { return q.c === 'X'; }).map(function (q) { return q.no; });
    if (bad.length) L.push('· 틀린 ' + bad.join('·') + '번은 풀이를 본 뒤 3일 안에 다시 풀고, 일주일 뒤 한 번 더 확인해요(오답노트).');
    if (d.es && d.es.graded) { var tg = {}; (d.es.tags || []).forEach(function (t) { ((t && t.t) || []).forEach(function (x) { tg[x] = (tg[x] || 0) + 1; }); }); var top = Object.keys(tg).sort(function (x, y) { return tg[y] - tg[x]; })[0]; if (top && tagOf(top)) L.push('· 서술형: ' + tagOf(top)[2]); }
    return L.join('\n');
  }
  function genCmp(d, p) {
    if (!p) return '이번이 첫 기록이에요. 다음 ' + (d.kind === '과제' ? '과제' : '회차') + '부터 이전 기록과 비교한 변화가 여기에 나와요.';
    var L = [], ds = r1(d.sc - p.sc);
    L.push(p.nm.replace(/\s*\(.*\)\s*$/, '') + '(' + p.sc + '점' + (p.cg != null ? ' · ' + gtxt(p) + '등급' : '') + ') → 이번 ' + d.sc + '점' + (d.cg != null ? ' · ' + gtxt(d) + '등급' : '') + ' : ' + (ds > 0 ? ds + '점 올랐어요.' : ds < 0 ? Math.abs(ds) + '점 내려갔어요.' : '점수는 같아요.'));
    if (d.avg != null && p.avg != null) { var rel = r1((d.sc - d.avg) - (p.sc - p.avg)); if (Math.abs(rel) >= 1) L.push('시험 난이도 차이를 빼고 반 평균 대비로 보면 ' + (rel > 0 ? Math.abs(rel) + '점 더 좋아졌어요.' : Math.abs(rel) + '점 아쉬워졌어요.')); }
    var up = [], dn = [];
    [1, 2, 3].forEach(function (l) { var x = lvRate(d, l), y = lvRate(p, l); if (x.me != null && y.me != null) { var df = x.me - y.me; if (df >= 10) up.push('난이도 ' + LVN[l] + ' ' + y.me + '%→' + x.me + '%'); else if (df <= -10) dn.push('난이도 ' + LVN[l] + ' ' + y.me + '%→' + x.me + '%'); } });
    d.order.forEach(function (u) { if (!p.un[u]) return; var x = unRate(d.un[u]), y = unRate(p.un[u]); if (x.me == null || y.me == null) return; var df = x.me - y.me; if (df >= 20) up.push('「' + u + '」 ' + y.me + '%→' + x.me + '%'); else if (df <= -20) dn.push('「' + u + '」 ' + y.me + '%→' + x.me + '%'); });
    if (up.length) L.push('나아진 점: ' + up.join(', ') + '.');
    if (dn.length) L.push('더 챙길 점: ' + dn.join(', ') + '.');
    if (!up.length && !dn.length) L.push('단원·난이도별 정답률은 지난번과 비슷한 흐름이에요.');
    if (d.es && p.es && d.es.graded && p.es.graded) { var a = Math.round(d.es.total / d.es.mx * 100), b = Math.round(p.es.total / p.es.mx * 100); L.push('서술형 득점률 ' + b + '% → ' + a + '%' + (a > b ? '로 좋아졌어요.' : a < b ? '로 낮아졌어요.' : '로 같아요.')); }
    L.push(ds > 2 ? '꾸준히 성장하고 있어요. 이 학습 방식을 유지해요!' : ds < -2 ? '한 번의 결과보다 흐름이 중요해요. 위 학습 처방대로 오답을 먼저 정리해요.' : '안정적인 흐름이에요. 상 난이도에 도전하면 한 단계 더 올라갈 수 있어요.');
    return L.join('\n');
  }
  function genFin(d, name) {
    var g = d.cg, L = [];
    if (g == null) L.push('이번 시험도 끝까지 잘 해냈어요.');
    else if (g < 1.5) L.push('상위권을 단단하게 지키고 있어요. 지금처럼 개념을 정확하게 쓰는 습관이 큰 힘이에요.');
    else if (g < 2.5) L.push('좋은 위치에 있어요. 조금만 더 정확하게 다듬으면 1등급 구간이 보여요.');
    else if (g < 3.5) L.push('성장 가능성이 큰 구간이에요. 오답 정리를 꾸준히 하면 점수가 눈에 띄게 올라요.');
    else L.push('지금은 기본기를 쌓는 시기예요. 쉬운 문제를 정확하게 푸는 것부터 하나씩 해결해 가요.');
    var wk = weakList(d)[0]; if (wk) L.push('이번 주 목표는 「' + wk.u + '」 오답 ' + wk.bad.length + '문항을 완벽하게 다시 푸는 것!');
    L.push('Always with you. 포기하지 않고 같이 가요.');
    return L.join('\n');
  }

  /* ───────── 문구 상자(선생님만 수정) ───────── */
  function dkey(d) { return d.it.m.id + '|' + (d.key || ''); }
  function txt(d, f, auto) { var k = dkey(d); if (DR[k] && f in DR[k]) return DR[k][f] == null ? auto : DR[k][f]; var s = savedF(d.it.m.id, d.key, f); return s != null ? s : auto; }
  function isEd(d, f) { var k = dkey(d); if (DR[k] && f in DR[k]) return DR[k][f] != null; return savedF(d.it.m.id, d.key, f) != null; }
  function edBox(d, f, auto) {
    var st = isStaff();
    return '<div class="rp-edw"><div class="rp-ed' + (isEd(d, f) ? ' edited' : '') + '" data-f="' + f + '" data-ex="' + d.it.m.id + '" data-key="' + esc(d.key || '') + '"' + (st ? ' contenteditable="true" spellcheck="false"' : '') + '>' + esc(txt(d, f, auto)) + '</div>' +
      (st ? '<button type="button" class="nocap rp-rs" data-rpt="reset" data-f="' + f + '" data-ex="' + d.it.m.id + '" data-key="' + esc(d.key || '') + '" title="자동으로 쓴 문구로 되돌려요">↺ 자동 문구</button>' : '') + '</div>';
  }
  function h4(t, sub, ed) { return '<h4>' + t + (sub ? '<small>' + sub + '</small>' : '') + (ed && isStaff() ? '<small class="nocap ed">✎ 글을 눌러 수정 → 위쪽 [코멘트 저장]</small>' : '') + '</h4>'; }
  /* 시험 이름표: 학교 · 학기 · 중간/기말 (제목에서 눈에 띄게) */
  var GSM_TERM = { tw1: '중간', hs2: '중간', sh3: '중간', yt4: '중간', dm5: '중간', sn6: '중간' };
  function termOf(d) {
    var nm = String(d.nm || ''), sc = d.inf.school || '', m = /(\d)\s*학기/.exec(nm), t = /(중간|기말)/.exec(nm), code = SCHC[sc] ? SCHC[sc] + d.inf.n : '';
    var term = t ? t[1] : (GSM_TERM[code] || ''), sem = m ? m[1] + '학기' : '1학기';
    return { school: sc, sem: sem, term: term, full: (sc ? sc + ' ' : '') + '1학년 ' + sem + (term ? ' ' + term + '고사' : ''), short: (sc ? sc + ' ' : '') + sem + (term ? ' ' + term : '') };
  }
  function hdr(name, title, sm, d, big) {
    var T = d ? termOf(d) : null, tt = big && T ? '<span class="ts">' + esc(T.school) + '</span> ' + esc(T.sem + (T.term ? ' ' + T.term + '고사' : '')) : title;
    return '<div class="rp-hd' + (sm ? ' sm' : '') + '"><img class="rp-ph" src="gsm_rpt_photo4.jpg" alt=""><div class="rp-phf"></div><div class="rp-hl"><div><div class="rp-br">MATHY YURI · 분당미래탐구 · 공수내모 성적표</div><div class="rp-tt">' + tt + '</div>' +
      (T && !big ? '<div class="rp-tm"><b>' + esc(T.short) + '</b>' + esc(title) + '</div>' : '') + (big && T ? '<div class="rp-tm"><b>' + esc(d.kind === '과제' ? '과제' : d.kind === '원본' ? '원본' : '동형 모의고사') + (d.nn ? ' ' + d.nn + '회' : '') + '</b>학교 시험 대비 성적표</div>' : '') + '</div></div><div class="rp-nm"><small>이름</small>' + esc(name) + '</div></div>';
  }
  function exbar(d) { return '<div class="rp-ex"><b style="background:' + kindCol(d.kind) + '">' + d.kind + '</b><span>' + esc(d.nm) + '</span><em>' + d.date.replace(/-/g, '.') + '</em></div>'; }

  /* ───────── 1쪽: 성적 요약 ───────── */
  function gradeAt(c, s) { return s >= c[0] ? 1 : s >= c[1] ? 2 : s >= c[2] ? 3 : s >= c[3] ? 4 : 5; }
  function distHtml(d) {
    var u = window.GSM_UP && GSM_UP[d.inf.school]; if (!u || !d.cuts) return '<div class="rp-mut">이 학교의 점수 분포 자료가 없어요.</div>';
    var c = d.cuts, bins = [], a, i, mx, T = d.tot || 100, X = function (s) { return Math.max(0, Math.min(100, 100 - s * 100 / T)); };
    for (a = 0; a <= 95; a += 5) bins.push(a < 95 ? u[a] - u[a + 5] : u[95]);
    mx = Math.max.apply(null, bins); var bars = '';
    for (i = 19; i >= 0; i--) { var v = bins[i]; bars += '<div class="gb" style="height:' + (v / mx * 86) + '%;background:' + GC[gradeAt(c, i * 5 + 2.5)] + '">' + (v >= 0.8 ? '<b>' + v.toFixed(1) + '</b>' : '') + '</div>'; }
    var marks = c.map(function (cs, k) { return '<div class="cut" style="left:' + X(cs) + '%"><span>' + (k + 1) + '등급 ' + cs + '↑</span></div>'; }).join('');
    var ax = ''; for (i = 0; i <= 100; i += 10) ax += '<span style="left:' + i + '%">' + (100 - i) + '</span>';
    var xm = X(d.sc), xa = d.avg != null ? X(d.avg) : null, lb = Math.max(14, Math.min(86, xm));
    var pin = '<div class="pin" style="left:' + xm + '%"></div><div class="pinl" style="left:' + lb + '%">나 ' + d.sc + '점' + (d.cg != null ? ' · ' + gtxt(d) + '등급' : '') + '</div>';
    var avg = xa == null ? '' : '<div class="avl" style="left:' + xa + '%"><span>반 평균 ' + d.avg + '</span></div>';
    return '<div class="gr-ch">' + bars + marks + avg + pin + '<span class="gr-yl">%</span></div><div class="gr-ax">' + ax + '</div><div class="gr-cp">점수 분포(5점 간격, 학생 비율 %) · <b>왼쪽이 높은 점수</b> · 점선 = 등급 경계 · 막대 색 = 그 점수대의 등급 · ' + esc(d.inf.school || '') + ' 기준 예상</div>';
  }
  function gradeTable(d) {
    if (!d.cuts) return '';
    var c = d.cuts, T = d.tot, h = '<table class="rp-gt"><tr><th>등급</th><th>예상 원점수</th><th>누적 상위</th></tr>';
    for (var g = 1; g <= 5; g++) {
      var up = g < 5 ? Math.round(upperAt(d.inf.school, c[g - 1])) + '%' : '100%', me = d.cg != null && Math.max(1, Math.min(5, Math.ceil(d.cg - 1e-9))) === g;
      h += '<tr' + (me ? ' class="me"' : '') + '><td><b style="background:' + GC[g] + ';color:' + GT[g] + '">' + g + '</b></td><td>' + (g === 1 ? c[0] + ' 이상' : g === 5 ? c[3] + ' 미만' : c[g - 1] + ' ~ ' + (c[g - 2] - 1)) + '</td><td>~ ' + up + '</td></tr>';
    }
    return h + '</table>';
  }
  function pageHtml(name, key, d) {
    var ev = d.ev, g = d.cg != null ? Math.max(1, Math.min(5, Math.ceil(d.cg - 1e-9))) : 0;
    return '<section class="rp pg">' + hdr(name, '공수내모 성적표', false, d, true) + exbar(d) +
      '<div class="rp-kpi"><div><small>내 점수</small><b>' + d.sc + '</b><span>/ ' + d.tot + '점' + (d.es && d.es.graded ? '<br>객관식 ' + d.obj + ' + 서술형 ' + d.es.total : (d.es && d.es.has ? '<br>서술형 채점 전(객관식 점수)' : '')) + '</span></div>' +
      '<div class="gk"><small>내 등급 · ' + esc(d.inf.school || '학교') + ' 기준</small>' + (ev ? '<b class="g">' + gtxt(d) + '<u>등급</u></b><span>상위 ' + topTxt(d.tp) + ' · <i style="background:' + GC[g] + ';color:' + GT[g] + '">' + g + '등급 구간</i></span>' : '<b>-</b><span>등급컷 자료 없음</span>') + '</div>' +
      '<div><small>우리 반</small><b>' + d.rk + '위</b><span>' + d.n + '명 중 · 평균 ' + (d.avg == null ? '-' : d.avg) + '점</span></div></div>' +
      '<div class="rp-sec">' + h4('등급 위치', '백분위로 계산한 연속 등급 · 0~1.00 = 1등급 구간 · 1~2.00 = 2등급 구간 … (경계: 상위 10·34·66·90%)') + distHtml(d) + '</div>' +
      '<div class="rp-row"><div class="rp-sec">' + h4('예상 등급표') + gradeTable(d) + '</div><div class="rp-sec">' + h4('난이도별 정답률', d.derived ? '반 정답률로 나눔' : '') + levelHtml(d) + '</div></div>' +
      '<div class="rp-sec">' + h4('AI 이해도 분석', '현재 이해 수준', true) + '<div class="rp-note">' + edBox(d, 'und', genUnd(d)) + '</div></div>' +
      '<div class="rp-ft">등급은 해설집 뒷편 「예상 등급표」와 같은 기준(학교별 예상 등급컷·점수 분포)이에요. 실제 학교 시험 결과와는 다를 수 있어요.</div></section>';
  }
  function levelHtml(d) {
    var h = '<div class="rp-lv">';
    [1, 2, 3].forEach(function (l) {
      var r = lvRate(d, l); if (!r.t) { h += '<div class="lr"><span class="lc" style="background:' + LVC[l] + '">' + LVN[l] + '</span><span class="rp-mut">문항 없음</span></div>'; return; }
      var df = r.cl != null ? r.me - r.cl : null;
      h += '<div class="lr"><span class="lc" style="background:' + LVC[l] + '">' + LVN[l] + '</span><div class="lb"><div class="bb"><i style="width:' + r.me + '%;background:' + LVC[l] + '"></i></div>' + (r.cl != null ? '<div class="bb c"><i style="width:' + r.cl + '%"></i></div>' : '') + '</div><div class="ln"><b>' + r.me + '%</b><small>' + (r.cl != null ? '반 ' + r.cl + '% ' : '') + (df != null ? arrow(df, '%p') : '') + '</small></div></div>';
    });
    return h + '<div class="rp-mut" style="margin-top:.6mm">위 막대 = 나 · 아래 회색 막대 = 반 평균 · 문항 ' + [1, 2, 3].map(function (l) { return LVN[l] + ' ' + d.lvs[l].t; }).join(' · ') + '</div></div>';
  }

  /* ───────── 2쪽: 문항별 상세 ───────── */
  function itemsHtml(d) {
    var h = '<table class="rp-qt"><tr><th>번호</th><th>유형</th><th>난이도</th><th class="l">단원 › 세부 개념</th><th>배점</th><th>결과</th><th>반 정답률</th></tr>';
    d.rows.forEach(function (q) {
      var s = q.c === 'O' ? '<b class="o">○</b>' : q.c === 'X' ? '<b class="x">✕</b>' : q.c === 'T' ? '<b class="t">△</b>' : '<span class="rp-mut">·</span>';
      h += '<tr class="' + (q.c === 'X' ? 'bad' : '') + '"><td>' + q.no + '</td><td>객관</td><td>' + (q.lv ? '<i class="lvt" style="background:' + LVC[q.lv] + '">' + LVN[q.lv] + '</i>' : '') + '</td><td class="l u">' + esc(q.unit) + (q.sub ? ' <span class="sb">› ' + esc(q.sub) + '</span>' : '') + '</td><td>' + q.pts + '</td><td>' + s + '</td><td class="cr">' + (q.cr == null ? '' : '<span class="cb"><i style="width:' + q.cr + '%"></i></span> ' + q.cr + '%') + '</td></tr>';
    });
    var E = d.es;
    if (E && E.has) E.max.forEach(function (m, k) {
      var v = E.got[k], has = v != null, l = d.ls ? +d.ls.charAt(d.rows.length + k) || 0 : 0, cl = E.cl && E.cl[k] != null ? E.cl[k] : null;
      var s = !has ? '<span class="rp-mut">·</span>' : v >= m ? '<b class="o">' + v + '</b>' : v <= 0 ? '<b class="x">' + v + '</b>' : '<b class="t">' + v + '</b>';
      h += '<tr class="es"><td>서' + (k + 1) + '</td><td>서술</td><td>' + (l ? '<i class="lvt" style="background:' + LVC[l] + '">' + LVN[l] + '</i>' : '') + '</td><td class="l u">서술형 <span class="sb">› 풀이 과정·답 평가</span></td><td>' + m + '</td><td>' + s + '</td><td class="cr">' + (cl == null ? '' : '<span class="cb"><i style="width:' + cl + '%"></i></span> ' + cl + '%') + '</td></tr>';
    });
    return h + '</table>';
  }
  function unitHtml(d) {
    if (!d.order.length) return '<div class="rp-mut">단원 정보가 없어요.</div>';
    return d.order.map(function (u) {
      var o = d.un[u], r = unRate(o), p = r.me, col = p >= 80 ? '#6b7a5e' : p >= 50 ? GOLD : '#a63d40', df = r.cl != null ? p - r.cl : null, subs = Object.keys(o.subs).map(function (k) { return o.subs[k]; });
      return '<div class="rp-ub2"><div class="un"><b>' + esc(u) + '</b><small>' + o.t + '문항</small></div><div class="lb"><div class="bb"><i style="width:' + p + '%;background:' + col + '"></i></div>' + (r.cl != null ? '<div class="bb c"><i style="width:' + r.cl + '%"></i></div>' : '') + '</div><div class="ln"><b>' + p + '%</b><small>' + (r.cl != null ? '반 ' + r.cl + '% ' : '') + (df != null ? arrow(df, '%p') : '') + '</small></div>' +
        '<div class="cn">' + subs.map(function (x) { return '<span class="' + (x.bad.length ? 'bd' : 'ok') + '">' + esc(x.s) + (x.bad.length ? ' ✕' + x.bad.join(',') : ' ✓') + '</span>'; }).join('') + '</div></div>';
    }).join('');
  }
  function page2Html(name, key, d) {
    return '<section class="rp pg">' + hdr(name, '문항별 분석', true, d) + exbar(d) +
      '<div class="rp-sec">' + h4('문항별 결과', '○ 맞힘 · ✕ 틀림 · △ 부분 점수 · 난이도 ' + (d.derived ? '(반 정답률로 나눔)' : '(출제 의도 기준)')) + itemsHtml(d) + '</div>' +
      '<div class="rp-sec">' + h4('단원·세부 개념별 정답률', '위 막대 = 나 · 아래 회색 = 반 평균 · ✓ 맞힘 ✕ 틀린 번호') + unitHtml(d) + '</div>' +
      '<div class="rp-ft">반 정답률 = 이번 시험을 본 반 친구들 중 그 문항을 맞힌 비율(△는 절반). 반 정답률이 높은 문제를 놓쳤다면 실수 점검이, 낮은 문제는 해설 학습이 우선이에요.</div></section>';
  }

  /* ───────── 3쪽: 학습 처방 ───────── */
  function weakHtml(d) {
    var wk = weakList(d).slice(0, 4);
    if (!wk.length) return '<div class="rp-note" style="text-align:center">틀린 문항이 없어요! 다음에는 더 어려운 문제에 도전해 봐요.</div>';
    return '<table class="rp-wt"><tr><th>우선</th><th class="l">단원</th><th>내 / 반</th><th class="l">틀린 문항 · 세부 개념</th><th class="l">보완 방법</th></tr>' + wk.map(function (o, i) {
      var r = unRate(o), a = actFor(o, d);
      return '<tr><td><b class="no">' + (i + 1) + '</b></td><td class="l"><b>' + esc(o.u) + '</b></td><td>' + r.me + '% / ' + (r.cl == null ? '-' : r.cl + '%') + '</td><td class="l">' + o.bad.map(function (q) { return q.no + '번' + (q.lv ? '<i class="lvt" style="background:' + LVC[q.lv] + '">' + LVN[q.lv] + '</i>' : ''); }).join(' ') + (a.subs.length ? '<div class="sb">' + a.subs.map(esc).join(' · ') + '</div>' : '') + '</td><td class="l sm">' + esc(a.act) + '</td></tr>';
    }).join('') + '</table>';
  }
  function page3Html(name, key, d) {
    var p = prevOf(d);
    return '<section class="rp pg">' + hdr(name, '학습 처방', true, d) + exbar(d) +
      '<div class="rp-sec">' + h4('더 공부해야 할 단원', '잃은 점수가 큰 순서') + weakHtml(d) + '</div>' +
      '<div class="rp-sec">' + h4('학습 처방', '다음 회차까지 할 일', true) + '<div class="rp-note">' + edBox(d, 'rx', genRx(d)) + '</div></div>' +
      '<div class="rp-sec">' + h4('지난 회차 대비', p ? '이전 ' + d.kind + ' 기록과 비교' : '', true) + (p ? cmpLines(d, prevAll(d)) : '') + '<div class="rp-note">' + edBox(d, 'cmp', genCmp(d, p)) + '</div></div>' +
      '<div class="rp-sec rp-fin">' + h4('선생님 최종 한마디', '', true) + '<div class="rp-note fin">' + edBox(d, 'fin', genFin(d)) + '</div><div class="rp-sig"><span class="sk">수학 강사</span><span class="sn">전유리</span><span class="sg">Mathy Yuri</span></div></div>' +
      '<div class="rp-ft">학습 처방은 이번 시험의 오답·난이도·반 정답률로 자동 작성한 뒤 선생님이 확인·수정한 내용이에요.</div></section>';
  }
  /* 같은 종류의 이전 회차 전부(오래된 → 최근) */
  function prevAll(d) {
    var L = [];
    exams().forEach(function (it) {
      if (it === d.it || kindOf(it) !== d.kind) return; var i2 = gsmInfo(it);
      var before = d.kind === '원본' ? dd(it) < d.date : (i2.n && d.nn ? i2.n < d.nn : dd(it) < d.date);
      if (!before) return; var row = rowOf(it, d.key); if (!row) return; L.push({ it: it, row: row, nn: i2.n });
    });
    L.sort(function (a, b) { return d.kind === '원본' ? dd(a.it).localeCompare(dd(b.it)) : a.nn - b.nn; });
    return L.map(function (x) { return calc(x.it, x.row, d.key); });
  }
  /* 지난 회차 대비 꺾은선 그래프: 회차가 쌓일수록 선이 길어지고, 한 그래프 안에 여러 선(점수·난이도·단원)이 나란히 나와요 */
  function cmpLines(d, prevs) {
    var H = prevs.concat([d]), K = H.length, pts = H.map(function (x, i) { return { n: x.nn, lab: i === K - 1 ? '이번' : (x.nn ? x.nn + '회' : x.date.slice(5).replace('-', '/')) }; });
    var pct = function (x) { return Math.round(x.sc / (x.tot || 100) * 1000) / 10; };
    var a = [{ vals: H.map(function (x) { return x.avg == null ? null : Math.round(x.avg / (x.tot || 100) * 1000) / 10; }), color: '#bdb8a5', dash: true, lab: false }, { vals: H.map(pct), color: NAVY, w: 2.6, lab: 'all', up: H.map(function () { return true; }) }];
    [1, 2, 3].forEach(function (l) { var v = H.map(function (x) { return lvRate(x, l).me; }); if (v.some(function (z) { return z != null; })) a.push({ vals: v, color: LVC[l], lab: 'last', up: v.map(function () { return l !== 2; }) }); });
    var ua = {}, units = d.order.slice(0, 6), UC = [NAVY, '#9a8450', '#6b7a5e', '#b5a58a', '#7f8a70', '#a63d40'];
    var b = units.map(function (u, i) { var v = H.map(function (x) { return x.un[u] ? unRate(x.un[u]).me : null; }); return { vals: v, color: UC[i % UC.length], lab: 'last', up: v.map(function (z, k) { return i % 2 === 0; }) }; });
    var O = { w: 260, h: 140, pl: 24, pr: 30, fs: 10, ticks: [0, 50, 100], vfmt: function (v) { return v + '%'; } };
    var chA = lineSvg(pts, a, O) + legend([['점수(%)', NAVY], ['반 평균', '#bdb8a5'], ['난이도 하', LVC[1]], ['중', LVC[2]], ['상', LVC[3]]]);
    var chB = b.length ? lineSvg(pts, b, O) + legend(units.map(function (u, i) { return [u, UC[i % UC.length]]; })) : '<div class="rp-mut">단원 정보가 없어요</div>';
    var gl = H.filter(function (x) { return x.cg != null; }).map(function (x) { return gfmt(x.cg); });
    return '<div class="rp-cmpc"><div class="cc"><div class="ch">점수 · 난이도별 추이</div>' + chA + '</div><div class="cc"><div class="ch">단원별 추이</div>' + chB + '</div></div>' +
      (gl.length > 1 ? '<div class="rp-lg"><span class="gm">등급 흐름 ' + gl.join(' → ') + '</span></div>' : '');
  }

  /* ───────── 서술형 쪽(채점된 경우) ───────── */
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
        '<div class="rp-ep"><div class="rp-en">서술형 ' + (k + 1) + ' ' + st + '</div><div class="rp-es"><b>' + (has ? v : '-') + '</b><span> / ' + m + '점</span></div><div class="rp-eb2"><i style="width:' + Math.round(r * 100) + '%;background:' + (r >= .85 ? '#6b7a5e' : r >= .5 ? GOLD : '#a63d40') + '"></i></div>' +
        (has && v < m ? (ts.length ? '<div class="rp-tg">' + ts.map(function (t) { return '<span>' + esc(t[1]) + '</span>'; }).join('') + '</div><div class="rp-ad">' + ts.map(function (t) { return esc(t[2]); }).join(' ') + '</div>' : '<div class="rp-ad rp-mut">감점 이유가 기록되지 않았어요. 감점된 부분을 다시 확인해 보세요.</div>') : (has ? '<div class="rp-ad">풀이 과정과 답이 모두 잘 쓰였어요.</div>' : '')) +
        (t0.m ? '<div class="rp-cm">✍ ' + esc(t0.m) + '</div>' : '') + '</div></div>';
    }).join('');
    return '<section class="rp pg">' + hdr(name, '서술형 분석', true, d) + exbar(d) +
      '<div class="rp-note" style="margin-top:1mm">' + sum + '</div>' + '<div class="rp-ebs">' + blocks + '</div>' +
      '<div class="rp-ft">서술형은 정답만큼 <b>풀이 과정</b>이 점수가 돼요. 답안 사진은 답안지 칸을 번호별로 잘라 보관한 것이에요.</div></section>';
  }

  /* ───────── 누적 성적표: 동형 + 과제 = 한 세트 ───────── */
  function cumData(key, upto) {
    var sets = {};
    exams().forEach(function (it) {
      var k = kindOf(it); if (k === '원본') return; var inf = gsmInfo(it); if (!inf.n || inf.n > upto) return; var row = rowOf(it, key); if (!row) return;
      var c = calc(it, row, key), s = sets[inf.n] = sets[inf.n] || { n: inf.n, school: inf.school }; s[k === '과제' ? 'hw' : 'dh'] = c;
    });
    return Object.keys(sets).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return sets[n]; });
  }
  function cumAgg(sets) {
    var U = {}, Lv = { 1: { g: 0, t: 0, cg: 0, ct: 0 }, 2: { g: 0, t: 0, cg: 0, ct: 0 }, 3: { g: 0, t: 0, cg: 0, ct: 0 } }, eg = 0, em = 0, list = [], sc = [];
    sets.forEach(function (s) { [s.dh, s.hw].forEach(function (d) {
      if (!d) return; list.push(d); sc.push(d.sc);
      d.order.forEach(function (u) { var o = d.un[u], x = U[u] = U[u] || { u: u, g: 0, t: 0, cg: 0, ct: 0 }; x.g += o.g; x.t += o.t; x.cg += o.cg; x.ct += o.ct; });
      [1, 2, 3].forEach(function (l) { var o = d.lvs[l]; Lv[l].g += o.g; Lv[l].t += o.t; Lv[l].cg += o.cg; Lv[l].ct += o.ct; });
      if (d.es && d.es.graded) { eg += d.es.total; em += d.es.mx; }
    }); });
    var gs = list.filter(function (d) { return d.cg != null; }).map(function (d) { return d.cg; });
    return { U: U, Lv: Lv, eg: eg, em: em, n: list.length, avg: sc.length ? r1(sc.reduce(function (a, b) { return a + b; }, 0) / sc.length) : null, avgG: gs.length ? gs.reduce(function (a, b) { return a + b; }, 0) / gs.length : null };
  }
  function setAvg(s) { var a = [s.dh, s.hw].filter(Boolean); return a.length ? r1(a.reduce(function (x, d) { return x + d.sc; }, 0) / a.length) : null; }
  /* ───────── 누적 그래프 도구 ───────── */
  function lineSvg(sets, lines, o) {
    o = o || {}; var W = o.w || 520, H = o.h || 150, pl = o.pl || 30, pr = o.pr || 14, pt = 14, pb = 22, N = sets.length, mn = o.min != null ? o.min : 0, mx = o.max != null ? o.max : 100;
    var Y = function (v) { var f = (Math.max(mn, Math.min(mx, v)) - mn) / (mx - mn); if (o.invert) f = 1 - f; return pt + (H - pt - pb) * (1 - f); };
    var X = function (i) { return N === 1 ? (pl + W - pr) / 2 : pl + 16 + (W - pl - pr - 32) * i / (N - 1); }, g = '', fm = o.fmt || function (v) { return v; };
    (o.ticks || [0, 25, 50, 75, 100]).forEach(function (v) { g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#e9e6da"/><text x="' + (pl - 5) + '" y="' + (Y(v) + 3.5) + '" text-anchor="end" font-size="11" fill="#5a5d4c">' + fm(v) + '</text>'; });
    var LL = [];
    lines.forEach(function (l) {
      var pts = []; l.vals.forEach(function (v, i) { if (v != null) pts.push([X(i), Y(v), v, i]); });
      if (pts.length > 1) g += '<polyline fill="none" stroke="' + l.color + '" stroke-width="' + (l.w || 2) + '" ' + (l.dash ? 'stroke-dasharray="4 3"' : '') + ' points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '"/>';
      pts.forEach(function (p) {
        g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (l.dash ? 2.4 : 3.6) + '" fill="' + l.color + '"/>';
        if (l.lab === 'last') { if (p[3] === pts[pts.length - 1][3]) LL.push({ x: p[0], y: p[1] + 3, t: (o.vfmt ? o.vfmt(p[2]) : p[2]), c: l.color }); } else if (l.lab !== false) { var up = l.up ? l.up[p[3]] !== false : true; g += '<text x="' + p[0] + '" y="' + (p[1] + (up ? -7 : 13)) + '" text-anchor="middle" font-size="' + (o.fs || 11) + '" font-weight="700" fill="' + l.color + '">' + (o.vfmt ? o.vfmt(p[2]) : p[2]) + '</text>'; }
      });
    });
    LL.sort(function (a, b) { return a.y - b.y; }); for (var q = 1; q < LL.length; q++) if (LL[q].y - LL[q - 1].y < 9) LL[q].y = LL[q - 1].y + 9;
    LL.forEach(function (z) { g += '<text x="' + (z.x + 6) + '" y="' + z.y + '" font-size="' + (o.fs || 11) + '" font-weight="700" fill="' + z.c + '">' + z.t + '</text>'; });
    sets.forEach(function (s, i) { g += '<text x="' + X(i) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="11.5" fill="#3c3f35">' + (s.lab != null ? s.lab : s.n + '세트') + '</text>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block">' + g + '</svg>';
  }
  function legend(items) { return '<div class="rp-lg">' + items.map(function (x) { return '<span><i style="background:' + x[1] + (x[2] ? ';opacity:.55' : '') + '"></i>' + x[0] + '</span>'; }).join('') + '</div>'; }
  function barSvg(sets) {
    var W = 260, H = 150, pl = 24, pr = 6, pt = 14, pb = 22, N = sets.length, gw = (W - pl - pr) / N, bw = Math.max(6, Math.min(16, gw / 4 - 2)), Y = function (v) { return pt + (H - pt - pb) * (1 - Math.max(0, Math.min(100, v)) / 100); }, g = '';
    [0, 50, 100].forEach(function (v) { g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#e9e6da"/><text x="' + (pl - 4) + '" y="' + (Y(v) + 3.5) + '" text-anchor="end" font-size="10" fill="#5a5d4c">' + v + '</text>'; });
    sets.forEach(function (s, i) {
      var cx = pl + gw * i + gw / 2, bars = [[s.dh && s.dh.sc, NAVY, 1], [s.dh && s.dh.avg, '#bdb8a5', 0], [s.hw && s.hw.sc, '#9a8450', 1], [s.hw && s.hw.avg, '#d9d2b8', 0]];
      bars.forEach(function (b, k) { if (b[0] == null) return; var x = cx - 2 * bw - 3 + k * (bw + 2); g += '<rect x="' + x + '" y="' + Y(b[0]) + '" width="' + bw + '" height="' + (Y(0) - Y(b[0])) + '" rx="1.5" fill="' + b[1] + '"/>' + (b[2] ? '<text x="' + (x + bw / 2) + '" y="' + (Y(b[0]) - 3) + '" text-anchor="middle" font-size="9" font-weight="700" fill="' + b[1] + '">' + Math.round(b[0]) + '</text>' : ''); });
      g += '<text x="' + cx + '" y="' + (H - 7) + '" text-anchor="middle" font-size="11" fill="#3c3f35">' + s.n + '세트</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block">' + g + '</svg>';
  }
  function add(M, k, o) { var x = M[k] = M[k] || { g: 0, t: 0, cg: 0, ct: 0 }; x.g += o.g; x.t += o.t; x.cg += o.cg; x.ct += o.ct; }
  function domOf(u) { return /다항식|나머지|인수|항등/.test(u) ? '다항식' : (/방정식|복소수|함수|부등식|판별|근/.test(u) ? '방정식과 부등식' : u); }
  function setAgg(s) {
    var U = {}, D = {}, Lv = {}; [s.dh, s.hw].forEach(function (d) {
      if (!d) return;
      d.order.forEach(function (u) { var o = d.un[u]; add(U, u, o); add(D, domOf(u), o); });
      [1, 2, 3].forEach(function (l) { add(Lv, l, d.lvs[l]); });
    });
    return { U: U, D: D, Lv: Lv };
  }
  function rateOf(x) { return x && x.t ? pc(x.g, x.t) : null; }
  function crateOf(x) { return x && x.ct ? pc(x.cg, x.ct) : null; }
  function lastDiff(vals) { var a = vals.filter(function (v) { return v != null; }); return a.length > 1 ? a[a.length - 1] - a[0] : null; }
  function miniChart(title, sets, aggs, pick) {
    var me = aggs.map(function (a) { return rateOf(pick(a)); }), cl = aggs.map(function (a) { return crateOf(pick(a)); }), last = me.filter(function (v) { return v != null; }).slice(-1)[0], df = lastDiff(me);
    if (last == null) return '';
    return '<div class="mc"><div class="mh"><b>' + esc(title) + '</b><span>' + last + '%' + (df != null ? ' ' + arrow(df, '%p') : '') + '</span></div>' +
      lineSvg(sets, [{ vals: cl, color: '#bdb8a5', dash: true, lab: false }, { vals: me, color: NAVY }], { w: 250, h: 112, ticks: [0, 50, 100], pl: 24, fs: 10, vfmt: function (v) { return v + '%'; } }) + '</div>';
  }
  function genTrend(sets, aggs) {
    if (sets.length < 2) return '단원·난이도별 추이는 2세트부터 비교해서 보여 드려요.';
    var L = [], names = {}; aggs.forEach(function (a) { Object.keys(a.U).forEach(function (u) { names[u] = 1; }); });
    var ch = Object.keys(names).map(function (u) { var v = aggs.map(function (a) { return rateOf(a.U[u]); }); return { u: u, df: lastDiff(v), last: v.filter(function (x) { return x != null; }).slice(-1)[0] }; }).filter(function (x) { return x.df != null; });
    ch.sort(function (a, b) { return b.df - a.df; });
    if (ch.length) {
      var up = ch[0], dn = ch[ch.length - 1];
      if (up.df >= 10) L.push('정답률이 가장 많이 오른 단원은 「' + up.u + '」(' + (up.df > 0 ? '+' : '') + Math.round(up.df) + '%p)이에요.');
      if (dn.df <= -10) L.push('「' + dn.u + '」은 ' + Math.round(Math.abs(dn.df)) + '%p 내려갔어요. 이 단원을 우선 복습해요.');
      var low = ch.filter(function (x) { return x.last != null && x.last < 60; }).map(function (x) { return '「' + x.u + '」'; });
      if (low.length) L.push('현재 정답률 60% 미만인 단원: ' + low.join(', ') + '.');
    }
    var lv = [1, 2, 3].map(function (l) { return { l: l, df: lastDiff(aggs.map(function (a) { return rateOf(a.Lv[l]); })) }; }).filter(function (x) { return x.df != null && Math.abs(x.df) >= 10; });
    lv.forEach(function (x) { L.push('난이도 ' + LVN[x.l] + ' 문항 정답률이 ' + Math.round(Math.abs(x.df)) + '%p ' + (x.df > 0 ? '올랐어요.' : '내려갔어요.')); });
    if (!L.length) L.push('단원·난이도별 정답률이 큰 변동 없이 안정적으로 유지되고 있어요.');
    return L.join(' ');
  }
  function genCum(sets, ag) {
    var L = [], last = sets[sets.length - 1], n = sets.length;
    L.push('지금까지 ' + n + '세트(동형 ' + sets.filter(function (s) { return s.dh; }).length + '회 · 과제 ' + sets.filter(function (s) { return s.hw; }).length + '회)를 치렀고, 누적 평균은 ' + ag.avg + '점' + (ag.avgG != null ? '(평균 ' + gfmt(ag.avgG) + '등급)' : '') + '이에요.');
    if (n >= 2) {
      var a = sets[n - 2], b = last, da = a.dh && b.dh ? r1(b.dh.sc - a.dh.sc) : null;
      if (da != null) { L.push('동형 ' + a.n + '회(' + a.dh.sc + '점) → ' + b.n + '회(' + b.dh.sc + '점)로 ' + (da > 0 ? da + '점 올랐어요.' : da < 0 ? Math.abs(da) + '점 내려갔어요.' : '같아요.') + (b.dh.avg != null && a.dh.avg != null ? ' 반 평균 대비로는 ' + (r1((b.dh.sc - b.dh.avg) - (a.dh.sc - a.dh.avg)) >= 0 ? '+' : '') + r1((b.dh.sc - b.dh.avg) - (a.dh.sc - a.dh.avg)) + '점 변화예요.' : '')); }
      if (a.dh && b.dh && a.dh.cg != null && b.dh.cg != null) L.push('등급은 ' + gtxt(a.dh) + ' → ' + gtxt(b.dh) + '으로 ' + (b.dh.cg < a.dh.cg - 0.005 ? '좋아졌어요.' : b.dh.cg > a.dh.cg + 0.005 ? '낮아졌어요.' : '같아요.'));
    }
    var dh = sets.filter(function (s) { return s.dh; }), hw = sets.filter(function (s) { return s.hw; });
    if (dh.length && hw.length) { var ad = dh.reduce(function (x, s) { return x + s.dh.sc; }, 0) / dh.length, ah = hw.reduce(function (x, s) { return x + s.hw.sc; }, 0) / hw.length, df = r1(ah - ad); L.push('과제 평균(' + r1(ah) + '점)이 동형 평균(' + r1(ad) + '점)보다 ' + (df >= 0 ? df + '점 높아요. 복습·과제가 실력으로 이어지고 있어요.' : Math.abs(df) + '점 낮아요. 동형에서 틀린 유형을 과제에서 다시 점검하는 습관이 필요해요.')); }
    var us = Object.keys(ag.U).map(function (k) { return ag.U[k]; }).filter(function (x) { return x.t >= 3; }).sort(function (x, y) { return x.g / x.t - y.g / y.t; });
    if (us.length) { var w = us[0], s2 = us[us.length - 1]; L.push('누적으로 가장 약한 단원은 「' + w.u + '」(' + pc(w.g, w.t) + '%' + (w.ct ? ' · 반 ' + pc(w.cg, w.ct) + '%' : '') + ')' + (us.length > 1 ? ', 가장 강한 단원은 「' + s2.u + '」(' + pc(s2.g, s2.t) + '%)예요.' : '예요.')); }
    var l1 = ag.Lv[1].t ? pc(ag.Lv[1].g, ag.Lv[1].t) : null, l3 = ag.Lv[3].t ? pc(ag.Lv[3].g, ag.Lv[3].t) : null;
    if (l1 != null && l3 != null) L.push('난이도별 누적 정답률은 하 ' + l1 + '% · 상 ' + l3 + '%로, ' + (l1 < 85 ? '기본 문항의 정확도를 먼저 끌어올리는 것이 가장 효율적이에요.' : l3 < 45 ? '상 난이도 응용 문제를 늘려 가면 한 단계 더 올라갈 수 있어요.' : '기본기와 응용력이 균형 있게 쌓이고 있어요.'));
    if (ag.em) L.push('서술형 누적 득점률은 ' + pc(ag.eg, ag.em) + '%(' + r1(ag.eg) + '/' + r1(ag.em) + '점)예요.');
    return L.join('\n');
  }
  function cumPages(name, key, d) {
    var sets = cumData(key, d.nn || 99);
    if (!sets.length) return [];
    var ag = cumAgg(sets), aggs = sets.map(setAgg), cell = function (c) { return c ? '<td><b>' + c.sc + '</b></td><td>' + (c.cg != null ? gfmt(c.cg) : '-') + '</td><td>' + topTxt(c.tp) + '</td>' : '<td colspan="3" class="rp-mut">제출·채점 대기</td>'; };
    var avgOf = function (k) { var a = sets.filter(function (s) { return s[k]; }); return a.length ? r1(a.reduce(function (x, s) { return x + s[k].sc; }, 0) / a.length) + '점' : '-'; };
    var tb = '<table class="rp-ht"><tr><th rowspan="2">세트</th><th rowspan="2">학교 · 시험</th><th colspan="3" style="background:' + NAVY + '">동형 모의고사</th><th colspan="3" style="background:#9a8450">과제</th><th rowspan="2">세트<br>평균</th></tr><tr><th>점수</th><th>등급</th><th>상위</th><th>점수</th><th>등급</th><th>상위</th></tr>' +
      sets.map(function (s) { var T = s.dh ? termOf(s.dh) : (s.hw ? termOf(s.hw) : null); return '<tr' + (s.n === d.nn ? ' class="me"' : '') + '><td><b>' + s.n + '</b></td><td class="l">' + esc(T ? T.short : (s.school || '')) + '</td>' + cell(s.dh) + cell(s.hw) + '<td><b>' + setAvg(s) + '</b></td></tr>'; }).join('') +
      '<tr class="sum"><td colspan="2">누적 평균</td><td colspan="3">' + avgOf('dh') + '</td><td colspan="3">' + avgOf('hw') + '</td><td><b>' + ag.avg + '</b>' + (ag.avgG != null ? '<small> ' + gfmt(ag.avgG) + '등급</small>' : '') + '</td></tr></table>';
    /* 점수 · 등급 추이 */
    var cmpUp = function (a, b, lowerBetter, strict) { return a.map(function (v, i) { if (v == null || b[i] == null) return true; return lowerBetter ? (strict ? v < b[i] : v <= b[i]) : (strict ? v > b[i] : v >= b[i]); }); };
    var dhS = sets.map(function (s) { return s.dh ? s.dh.sc : null; }), hwS = sets.map(function (s) { return s.hw ? s.hw.sc : null; }), avS = sets.map(function (s) { return s.dh ? s.dh.avg : null; });
    var scoreC = lineSvg(sets, [{ vals: avS, color: '#bdb8a5', dash: true, lab: false }, { vals: dhS, color: NAVY, up: cmpUp(dhS, hwS) }, { vals: hwS, color: '#9a8450', up: cmpUp(hwS, dhS, false, true) }]) + legend([['동형', NAVY], ['과제', '#9a8450'], ['반 평균(동형)', '#bdb8a5']]);
    var gd = sets.map(function (s) { return s.dh && s.dh.cg != null ? Math.round(s.dh.cg * 100) / 100 : null; }), gh = sets.map(function (s) { return s.hw && s.hw.cg != null ? Math.round(s.hw.cg * 100) / 100 : null; });
    var gradeC = lineSvg(sets, [{ vals: gd, color: NAVY, up: cmpUp(gd, gh, true) }, { vals: gh, color: '#9a8450', up: cmpUp(gh, gd, true, true) }], { w: 260, h: 150, min: 0, max: 5, invert: true, ticks: [0, 1, 2, 3, 4, 5], pl: 24, fs: 10, fmt: function (v) { return v; }, vfmt: function (v) { return v.toFixed(2); } }) + legend([['동형', NAVY], ['과제', '#9a8450']]);
    var p1 = '<section class="rp pg">' + hdr(name, '누적 성적표', true) +
      '<div class="rp-ex"><b style="background:#9a8450">누적</b><span>동형 + 과제 = 1세트 · ' + sets[0].n + '~' + sets[sets.length - 1].n + '세트</span><em>' + d.date.replace(/-/g, '.') + ' 기준</em></div>' +
      '<div class="rp-sec">' + h4('세트별 성적', '과제를 제출하면 그 세트에 바로 쌓여요') + tb + '</div>' +
      '<div class="rp-sec">' + h4('점수 추이', '동형 · 과제 · 반 평균') + scoreC + '</div>' +
      '<div class="rp-row2"><div class="rp-sec">' + h4('등급 추이', '아래로 갈수록 좋아요(1등급 = 1.00)') + gradeC + '</div><div class="rp-sec">' + h4('세트별 비교', '나 vs 반 평균') + barSvg(sets) + '<div class="rp-lg"><span><i style="background:' + NAVY + '"></i>동형 나</span><span><i style="background:#bdb8a5"></i>동형 반</span><span><i style="background:#9a8450"></i>과제 나</span><span><i style="background:#d9d2b8"></i>과제 반</span></div></div></div>' +
      '<div class="rp-sec">' + h4('누적 분석 · 회차 비교', '', true) + '<div class="rp-note">' + edBox(d, 'cum', genCum(sets, ag)) + '</div></div>' +
      '<div class="rp-ft">누적 성적표는 동형 모의고사와 과제를 한 세트로 묶어 회차가 쌓일수록 자동으로 늘어나요. 학교마다 시험 난이도가 달라 점수보다 반 평균 대비·등급 흐름을 함께 보세요.</div></section>';
    /* 단원·영역·난이도별 정답률 추이 */
    var uNames = {}; aggs.forEach(function (a) { Object.keys(a.U).forEach(function (u) { uNames[u] = 1; }); });
    var uList = Object.keys(uNames).filter(function (u) { return aggs.some(function (a) { return a.U[u] && a.U[u].t; }); }).slice(0, 6);
    var umini = uList.map(function (u) { return miniChart(u, sets, aggs, function (a) { return a.U[u]; }); }).join('');
    var dNames = {}; aggs.forEach(function (a) { Object.keys(a.D).forEach(function (u) { dNames[u] = 1; }); });
    var DCOL = [NAVY, '#9a8450', '#6b7a5e', '#b5a58a'], dl = Object.keys(dNames).slice(0, 4);
    var domC = lineSvg(sets, dl.map(function (k, i) { var v = aggs.map(function (a) { return rateOf(a.D[k]); }); return { vals: v, color: DCOL[i], up: v.map(function () { return i % 2 === 0; }) }; }), { w: 260, h: 150, pl: 24, fs: 10, ticks: [0, 50, 100], vfmt: function (v) { return v + '%'; } }) + legend(dl.map(function (k, i) { return [k, DCOL[i]]; }));
    var lvC = lineSvg(sets, [1, 2, 3].map(function (l) { var v = aggs.map(function (a) { return rateOf(a.Lv[l]); }); return { vals: v, color: LVC[l], up: v.map(function () { return l !== 2; }) }; }), { w: 260, h: 150, pl: 24, fs: 10, ticks: [0, 50, 100], vfmt: function (v) { return v + '%'; } }) + legend([['하', LVC[1]], ['중', LVC[2]], ['상', LVC[3]]]);
    var p2 = '<section class="rp pg">' + hdr(name, '영역별 정답률 추이', true) +
      '<div class="rp-ex"><b style="background:#9a8450">누적</b><span>단원 · 영역 · 난이도별 정답률 변화 (동형+과제 합산)</span><em>' + d.date.replace(/-/g, '.') + ' 기준</em></div>' +
      '<div class="rp-sec">' + h4('단원별 정답률 추이', '진한 선 = 나 · 점선 = 반 평균') + '<div class="mcg">' + (umini || '<div class="rp-mut">단원 정보가 있는 시험이 아직 없어요.</div>') + '</div></div>' +
      '<div class="rp-row2"><div class="rp-sec">' + h4('영역(대단원)별 추이') + domC + '</div><div class="rp-sec">' + h4('난이도별 추이') + lvC + '</div></div>' +
      '<div class="rp-sec">' + h4('추이 해설', '자동 작성') + '<div class="rp-note"><div class="rp-ed">' + esc(genTrend(sets, aggs)) + '</div></div></div>' +
      '<div class="rp-ft">단원·영역·난이도별 정답률은 그 세트의 동형과 과제 문항을 모두 합쳐 계산해요. 문항 수가 적은 단원은 한 문제로도 크게 움직일 수 있어요.</div></section>';
    return [p1, p2];
  }
  function pagesHtml(name, key, d) {
    var w = function (x) { return x ? '<div class="pgw">' + x + '</div>' : ''; }, h = '', m = V.mode;
    if (m !== 'cum') { h += w(pageHtml(name, key, d)) + w(page2Html(name, key, d)) + w(page3Html(name, key, d)); if (d.es && d.es.has && d.es.graded) h += w(essPage(name, d)); }
    if (m !== 'ex') cumPages(name, key, d).forEach(function (x) { h += w(x); });
    return h;
  }

  var SERIF = '"Playfair Display","Noto Serif KR","Nanum Myeongjo","Batang","바탕",serif';
  var CSS = '.rpov{position:fixed;inset:0;z-index:9999;background:#ece9de;display:flex;flex-direction:column;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif}' +
    '.rpov .rb{background:#2f4a3c;color:#fff;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.rpov .rb b{font-size:15px}.rpov .rb select{padding:6px 8px;border-radius:8px;border:0;max-width:60vw}' +
    '.rpov .rb button{border:0;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;background:#b5a58a;color:#262a24}.rpov .rb button.g{background:#fff2;color:#fff}.rpov .rb .sp{flex:1}' +
    '.rpov .pk{background:#f0eee3;padding:8px 14px;border-bottom:1px solid #dedacb;display:flex;flex-wrap:wrap;gap:6px;align-items:center;max-height:22vh;overflow:auto}' +
    '.rpov .pk label{display:inline-flex;gap:4px;align-items:center;background:#fff;border:1px solid #d8d5c5;border-radius:99px;padding:3px 10px;font-size:13px;cursor:pointer}.rpov .pk label.on{background:#f2efe4;border-color:#2f4a3c;font-weight:700}' +
    '.rpov .vw{flex:1;overflow:auto;padding:12px 8px 40px}.rpov .pgw{margin:0 auto 14px;width:fit-content;box-shadow:0 2px 14px #0003}.rpov .msg{text-align:center;padding:40px 12px;color:#3c3f35}' +
    '.rp{width:210mm;height:297mm;box-sizing:border-box;padding:9mm 11mm 8mm;background:#fbfaf5;color:#262a24;font-variant-numeric:lining-nums;font-weight:500;font-family:' + SERIF + ';font-size:calc(8.6pt*var(--fs,1));line-height:1.42;display:flex;flex-direction:column;gap:calc(3mm*var(--k,1));overflow:hidden;position:relative;text-align:left}.rp>*{flex-shrink:0}.rp.fit{justify-content:space-between}.rp.fit .rp-ft{margin-top:0}' +
    '.rp *{box-sizing:border-box}.rp-mut{color:#5a5d4c;font-size:calc(7.6pt*var(--fs,1))}.rp b{font-weight:800}' +
    '.rp-hd{background:#2f4a3c;color:#fff;margin:-9mm -11mm 0;padding:6mm 11mm 4.4mm;display:flex;justify-content:space-between;align-items:center;border-bottom:1.2mm solid #b5a58a}' +
    '.rp-hl{display:flex;align-items:center;gap:4mm;position:relative;z-index:2;margin-left:43mm}.rp-hd.sm .rp-hl{margin-left:28mm}.rp-ph{position:absolute;left:0;top:0;height:100%;width:auto;z-index:0}.rp-phf{position:absolute;left:0;top:0;height:100%;width:58mm;z-index:1;background:linear-gradient(90deg,rgba(47,74,60,0) 0%,rgba(47,74,60,0) 60%,rgba(47,74,60,.9) 94%,#2f4a3c 100%),linear-gradient(0deg,rgba(47,74,60,.28) 0%,rgba(47,74,60,0) 30%)}.rp-hd.sm .rp-phf{width:41.5mm}.rp-hd{position:relative;height:42mm}.rp-hd.sm{height:30mm}.rp-nm{position:relative;z-index:2}' +
    '.rp-br{font-size:calc(7.2pt*var(--fs,1));letter-spacing:.14em;color:#e3dcc9;font-weight:700}.rp-tt{font-size:calc(19pt*var(--fs,1));font-weight:900;margin-top:.6mm}.rp-nm{font-size:calc(17pt*var(--fs,1));font-weight:900;text-align:right}.rp-nm small{display:block;font-size:calc(7pt*var(--fs,1));font-weight:600;color:#e3dcc9;letter-spacing:.1em}' +
    '.rp-ex{display:flex;align-items:center;gap:2.4mm;margin-top:1.2mm;font-size:calc(10pt*var(--fs,1));font-weight:800}.rp-ex b{color:#fff;font-size:calc(7.6pt*var(--fs,1));padding:.7mm 2.4mm;border-radius:99px}.rp-ex em{margin-left:auto;font-style:normal;font-size:calc(8pt*var(--fs,1));color:#464938;font-weight:600}' +
    '.rp-kpi{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:3mm}.rp-kpi>div{border:.3mm solid #e0dccf;background:#f4f1e7;border-radius:2.4mm;padding:2.2mm 3.4mm;text-align:center}.rp-kpi small{display:block;font-size:calc(7.2pt*var(--fs,1));color:#5b5f4e;font-weight:700}' +
    '.rp-kpi b{display:inline-block;font-size:calc(22pt*var(--fs,1));font-weight:900;color:#2f4a3c;line-height:1.15;margin-top:.4mm}.rp-kpi b.g{font-size:calc(25pt*var(--fs,1));color:#9a8450}.rp-kpi b.g u{text-decoration:none;font-size:calc(10pt*var(--fs,1));margin-left:1mm;color:#3c3f35}.rp-kpi span{display:block;font-size:calc(7.6pt*var(--fs,1));color:#3c3f35;margin-top:.2mm}.rp-kpi span i{font-style:normal;font-weight:800;padding:.2mm 1.8mm;border-radius:99px;font-size:calc(7pt*var(--fs,1))}' +
    '.rp-sec h4{margin:0 0 1.5mm;font-size:calc(9.4pt*var(--fs,1));color:#2f4a3c;border-left:1.2mm solid #9a8450;padding-left:2mm}.rp-sec h4 small{font-weight:500;color:#5a5d4c;font-size:calc(6.8pt*var(--fs,1));margin-left:2mm}.rp-sec h4 small.ed{color:#9a8450}' +
    '.rp-row{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.rp-row2{display:grid;grid-template-columns:1fr 1fr;gap:5mm}' +
    '.gr-ch{position:relative;height:calc(47mm*(1 + (var(--k,1) - 1)*.5));margin:11mm 2mm 0 6mm;border-bottom:.35mm solid #2f4a3c;border-left:.25mm solid #e0dccf;display:flex;align-items:flex-end}.gr-ch .gb{position:relative;flex:1 1 0;margin:0 .3mm}.gr-ch .gb b{position:absolute;bottom:100%;left:-2mm;right:-2mm;text-align:center;font:700 calc(6.8pt*var(--fs,1)) ' + SERIF + ';color:#333;padding-bottom:.3mm}' +
    '.gr-ch .cut{position:absolute;top:-5mm;bottom:0;border-left:.35mm dashed #9a8450}.gr-ch .cut span{position:absolute;top:0;left:.8mm;font:900 calc(6.8pt*var(--fs,1)) ' + SERIF + ';color:#9a8450;white-space:nowrap;background:#fbfaf5;padding:0 .5mm}' +
    '.gr-ch .pin{position:absolute;top:-8mm;bottom:0;border-left:.7mm solid #9a8450;z-index:3}.gr-ch .pinl{position:absolute;top:-11.5mm;transform:translateX(-50%);background:#9a8450;color:#fff;font:800 calc(7.4pt*var(--fs,1)) ' + SERIF + ';padding:.5mm 2.4mm;border-radius:99px;white-space:nowrap;z-index:4}' +
    '.gr-ch .avl{position:absolute;top:2mm;bottom:0;border-left:.35mm dotted #3c3f35;z-index:2}.gr-ch .avl span{position:absolute;bottom:1mm;left:1mm;font:700 calc(6.8pt*var(--fs,1)) ' + SERIF + ';color:#3c3f35;white-space:nowrap;background:#fffd;padding:0 .6mm}.gr-yl{position:absolute;left:-5.5mm;top:-1mm;font:600 calc(6.8pt*var(--fs,1)) ' + SERIF + ';color:#5d604f}' +
    '.gr-ax{position:relative;height:4mm;margin:0 2mm 0 6mm;font:600 calc(6.8pt*var(--fs,1)) ' + SERIF + ';color:#4a4d41}.gr-ax span{position:absolute;top:.8mm;transform:translateX(-50%)}.gr-cp{font-size:calc(6.8pt*var(--fs,1));color:#5a5d4c;margin:0 0 0 6mm}' +
    '.rp-gt{width:100%;border-collapse:collapse;font-size:calc(7.8pt*var(--fs,1));text-align:center}.rp-gt th{background:#2f4a3c;color:#e3dcc9;padding:.9mm;font-size:calc(7pt*var(--fs,1))}.rp-gt td{border-bottom:.2mm solid #e8e4d8;padding:.9mm}.rp-gt td b{display:inline-block;min-width:6mm;border-radius:1mm;padding:.2mm 0}.rp-gt tr.me td{background:#e6ecdc;font-weight:800}' +
    '.rp-lv .lr,.rp-ub2{display:grid;grid-template-columns:9mm 1fr 20mm;gap:2mm;align-items:center;margin-bottom:calc(1.6mm*var(--k,1))}.rp-ub2{grid-template-columns:24mm 1fr 22mm;margin-bottom:calc(2mm*var(--k,1))}.rp-ub2.sm{grid-template-columns:22mm 1fr 18mm;margin-bottom:1.4mm}' +
    '.lc{display:inline-block;text-align:center;color:#fff;font-weight:800;font-size:calc(8pt*var(--fs,1));border-radius:99px;padding:.5mm 0}.lvt{font-style:normal;display:inline-block;color:#fff;font-size:calc(6.8pt*var(--fs,1));font-weight:800;border-radius:99px;padding:.1mm 1.5mm;margin-left:.8mm}' +
    '.bb{height:2.6mm;background:#ebe8dc;border-radius:99px;overflow:hidden}.bb+.bb{margin-top:.8mm;height:1.8mm}.bb i{display:block;height:100%}.bb.c i{background:#bdb8a5}.ln{text-align:right;font-size:calc(8pt*var(--fs,1));line-height:1.2}.ln small{display:block;font-size:calc(6.8pt*var(--fs,1));color:#55584a}' +
    '.rp-ub2 .un b{font-size:calc(8.2pt*var(--fs,1));display:block}.rp-ub2 .un small{font-size:calc(6.8pt*var(--fs,1));color:#5a5d4c}.rp-ub2 .cn{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:1mm;margin-top:-.6mm}.cn span{font-size:calc(6.8pt*var(--fs,1));padding:.2mm 1.8mm;border-radius:99px;background:#f2efe4;color:#3a3d31}.cn span.bd{background:#f2dddb;color:#9a8450;font-weight:700}.cn span.ok{background:#e2ecd9;color:#6b7a5e}' +
    'b.up{color:#6b7a5e;font-size:calc(6.8pt*var(--fs,1))}b.dn{color:#a63d40;font-size:calc(6.8pt*var(--fs,1))}b.zz{color:#5d604f;font-size:calc(6.8pt*var(--fs,1))}' +
    '.rp-qt{width:100%;border-collapse:collapse;font-size:calc(7.5pt*var(--fs,1));text-align:center}.rp-qt th{background:#f2efe4;color:#2f4a3c;padding:.9mm;font-size:calc(6.8pt*var(--fs,1))}.rp-qt td{border-bottom:.2mm solid #eae7db;padding:.5mm .4mm;height:calc(5.2mm*var(--k,1))}.rp-qt .l{text-align:left}.rp-qt td.u{white-space:nowrap;overflow:hidden;max-width:74mm;text-overflow:ellipsis}.rp-qt .sb{color:#464938;font-size:calc(6.8pt*var(--fs,1))}' +
    '.rp-qt tr.bad td{background:#f2dddb}.rp-qt tr.es td{background:#f4f1e7}.rp-qt b.o{color:#6b7a5e}.rp-qt b.x{color:#a63d40}.rp-qt b.t{color:#a8904f}.rp-qt td.cr{text-align:left;white-space:nowrap;font-size:calc(7pt*var(--fs,1))}.cb{display:inline-block;width:14mm;height:2mm;background:#ebe8dc;border-radius:99px;vertical-align:middle;overflow:hidden}.cb i{display:block;height:100%;background:#bdb8a5}' +
    '.rp-wt{width:100%;border-collapse:collapse;font-size:calc(7.8pt*var(--fs,1));text-align:center}.rp-wt th{background:#f2dddb;color:#9a8450;padding:.9mm;font-size:calc(6.8pt*var(--fs,1))}.rp-wt td{border-bottom:.2mm solid #eed7d4;padding:calc(1.2mm*var(--k,1)) .8mm;vertical-align:top}.rp-wt .l{text-align:left}.rp-wt b.no{display:inline-block;width:5mm;height:5mm;line-height:5mm;border-radius:50%;background:#9a8450;color:#fff}.rp-wt .sb{font-size:calc(6.8pt*var(--fs,1));color:#464938}.rp-wt .sm{font-size:calc(7.2pt*var(--fs,1))}' +
    '.rp-note{border:.3mm dashed #b5a58a;background:#f7f5ec;border-radius:2mm;padding:2.2mm 3mm;line-height:calc(1.7 + .3*(var(--k,1) - 1))}.rp-note.fin{background:#f4f1e7;border-color:#b4b39f}' +
    '.rp-edw{position:relative}.rp-ed{white-space:pre-wrap;outline:none;min-height:5mm;font-size:calc(8.4pt*var(--fs,1));line-height:calc(1.75 + .3*(var(--k,1) - 1))}.rp-ed[contenteditable]{cursor:text}.rp-ed[contenteditable]:hover,.rp-ed[contenteditable]:focus{background:#f1f0e3}.rp-ed.edited{color:#2a3d31}' +
    '.rp-rs{position:absolute;right:-1mm;top:-2.6mm;border:0;background:#eee;color:#3c3f35;border-radius:99px;font-size:calc(6.8pt*var(--fs,1));padding:.4mm 2mm;cursor:pointer;font-family:inherit}' +
    '.rp-cmp{display:flex;flex-wrap:wrap;gap:1.6mm 5mm;margin:0 0 1.6mm;font-size:calc(8pt*var(--fs,1))}.rp-cmp .cr2{display:flex;align-items:center;gap:1.2mm;background:#f6f4ea;border-radius:99px;padding:.6mm 3mm}.rp-cmp .cl{color:#464938;font-size:calc(7pt*var(--fs,1))}.rp-cmp .ar{color:#8a8d7d}' +
    '.rp-ht{width:100%;border-collapse:collapse;font-size:calc(7.8pt*var(--fs,1));text-align:center}.rp-ht th{background:#2f4a3c;color:#e3dcc9;padding:.9mm;font-size:calc(6.8pt*var(--fs,1))}.rp-ht td{border-bottom:.2mm solid #eae7db;padding:calc(1mm*var(--k,1)) .6mm}.rp-ht tr.me td{background:#e6ecdc}.rp-ht tr.sum td{background:#f2efe4;font-weight:800;border-top:.4mm solid #2f4a3c}.rp-ht small{font-size:calc(6.8pt*var(--fs,1));font-weight:500}' +
    '.rp-lg{display:flex;gap:4mm;justify-content:center;font-size:calc(7pt*var(--fs,1));color:#3c3f35;margin-top:.6mm}.rp-lg i{display:inline-block;width:3mm;height:1.4mm;border-radius:99px;margin-right:1mm;vertical-align:middle}' +
    '.rp-tt .ts{color:#e3dcc9}.rp-tm{margin-top:1.2mm;font-size:calc(8.4pt*var(--fs,1));color:#e6e3d2}.rp-tm b{background:#b5a58a;color:#2f4a3c;border-radius:99px;padding:.4mm 2.6mm;margin-right:2mm;font-size:calc(8.2pt*var(--fs,1))}.rp-hd.sm .rp-tm{margin-top:.6mm}.mcg{display:grid;grid-template-columns:1fr 1fr;gap:2mm 6mm}.mc .mh{display:flex;justify-content:space-between;align-items:baseline;font-size:calc(8.2pt*var(--fs,1));margin-bottom:.4mm}.mc .mh span{font-weight:800;color:#2f4a3c}.rp-ht td.l{text-align:left;padding-left:2mm;font-size:calc(7.4pt*var(--fs,1))}.rp-sig{display:flex;align-items:baseline;justify-content:flex-end;gap:3mm;margin-top:1.4mm;padding:0 3mm 2mm 0;color:#2f4a3c}.rp-sig .sk{font:500 calc(8pt*var(--fs,1)) Noto Serif KR,serif;color:#464938}.rp-sig .sn{font:400 calc(17pt*var(--fs,1)) Nanum Pen Script,Noto Serif KR,cursive;letter-spacing:.06em}.rp-sig .sg{font:400 calc(25pt*var(--fs,1)) Pinyon Script,cursive;color:#9a8450;transform:rotate(-3deg);display:inline-block}.rp-cmpc{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-bottom:1.4mm}.rp-cmpc .ch{font-size:calc(7.6pt*var(--fs,1));color:#464938;margin-bottom:1mm}.cr3{display:grid;grid-template-columns:17mm 1fr 13mm;gap:1.6mm;align-items:center;margin-bottom:1.5mm}.cn3{font-size:calc(7.8pt*var(--fs,1));font-weight:700}.cbs{display:flex;flex-direction:column;gap:.5mm}.cb2{position:relative;height:2.5mm;background:#ece9df;border-radius:99px}.cb2 i{display:block;height:100%;border-radius:99px}.cb2 em{position:absolute;right:1.2mm;top:0;font-style:normal;font-size:calc(6.8pt*var(--fs,1));line-height:2.5mm;color:#33362c}.cd3{text-align:right}.rp-lg .gm{margin-left:4mm;color:#9a8450;font-weight:700}.rp-hd.sm{padding-bottom:3.4mm}.rp-hd.sm .rp-tt{font-size:calc(15pt*var(--fs,1))}' +
    '.rp-ebs{display:flex;flex-direction:column;gap:calc(3.4mm*var(--k,1))}.rp-eb{display:flex;gap:4mm;align-items:flex-start;border-bottom:.2mm solid #eae7db;padding-bottom:3mm}.rp-ei{flex:none;border:.3mm solid #dedacb;border-radius:1.4mm;overflow:hidden;background:#fbfaf4}.rp-ei img{display:block;object-fit:fill}' +
    '.rp-ep{flex:1;min-width:0}.rp-en{font-weight:900;color:#2f4a3c;font-size:calc(9.4pt*var(--fs,1))}.rp-chip{display:inline-block;font-size:calc(6.8pt*var(--fs,1));padding:.3mm 2mm;border-radius:99px;background:#e9e6da;color:#3c3f35;margin-left:1.4mm;vertical-align:1px}.rp-chip.ok{background:#e2ecd9;color:#35603f}.rp-chip.bad{background:#f0d6d3;color:#a63d40}.rp-chip.mid{background:#ebe8d6;color:#5b5f4e}' +
    '.rp-es b{font-size:calc(18pt*var(--fs,1));font-weight:900;color:#2f4a3c}.rp-es span{font-size:calc(8pt*var(--fs,1));color:#4a4d41}.rp-eb2{height:2.4mm;background:#ebe8dc;border-radius:99px;overflow:hidden;margin:1mm 0 1.6mm}.rp-eb2 i{display:block;height:100%}' +
    '.rp-tg{display:flex;flex-wrap:wrap;gap:1mm}.rp-tg span{background:#f2dddb;color:#9a8450;font-size:calc(7pt*var(--fs,1));font-weight:700;padding:.4mm 2mm;border-radius:99px}.rp-ad{font-size:calc(7.4pt*var(--fs,1));line-height:1.55;color:#33362c;margin-top:1.2mm}.rp-cm{font-size:calc(7.6pt*var(--fs,1));color:#2f4a3c;margin-top:1.2mm;background:#f2efe4;border-radius:1.4mm;padding:1mm 2mm}' +
    '.rp-ft{margin-top:auto;font-size:calc(6.8pt*var(--fs,1));color:#5a5d4c;border-top:.2mm solid #e0dccf;padding-top:1.6mm}' +
    '.rp.cap .rp-ed,.rp.cap .rp-ed:hover{background:none}.rp.cap .nocap{display:none!important}';

  function ensureCss() {
    if (!document.getElementById('rptfont')) { var l = document.createElement('link'); l.id = 'rptfont'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Pinyon+Script&family=Nanum+Pen+Script&display=swap'; document.head.appendChild(l); }
    if (!document.getElementById('rptcss')) { var s = document.createElement('style'); s.id = 'rptcss'; s.textContent = CSS; document.head.appendChild(s); }
  }
  function stuList(it) { return ((it && it.all) || []).filter(function (r) { return r.ox && r.score != null; }).sort(function (a, b) { return String(a.name || '').localeCompare(String(b.name || ''), 'ko'); }); }
  function ov() { return document.getElementById('rptOv'); }
  function needEss(L) { return L.filter(function (x) { return ESS[x.m.id] === undefined; }); }
  async function fillImgs(root) {
    var im = [].slice.call(root.querySelectorAll('img.rp-eimg:not([data-done])')), i = 0;
    async function w() { while (i < im.length) { var e = im[i++]; e.setAttribute('data-done', '1'); var a = { exam_id: e.dataset.ex, k: +e.dataset.k }; if (e.dataset.sid) a.sid = e.dataset.sid; var j = await omrApi('eimg', a);
      if (j && j.ok) { await new Promise(function (r) { e.onload = e.onerror = r; e.src = j.src; }); } else { e.removeAttribute('src'); e.parentNode.innerHTML = '<div class="rp-mut" style="padding:4mm;text-align:center">답안 사진이 없어요<br>(선생님께 말씀해 주세요)</div>'; } } }
    await Promise.all([w(), w(), w()]);
  }
  function dirtyN() { var n = 0; Object.keys(DR).forEach(function (k) { n += Object.keys(DR[k]).length; }); return n; }
  /* 쪽 맞추기: 쪽마다 아래가 비지 않도록 줄 간격·칸 여백·그래프 높이를 늘려 A4 한 장에 딱 맞춰요(넘치면 자동으로 줄여요) */
  function fitPage(rp) {
    if (!rp || !rp.isConnected) return;
    rp.classList.add('fit'); var fits = function () { return rp.scrollHeight <= rp.clientHeight; }, fs = 1.22, lo = 0.5, hi = 2.4, i;
    rp.style.setProperty('--k', lo);
    for (; fs >= 0.97; fs -= 0.02) { rp.style.setProperty('--fs', fs); if (fits()) break; }
    if (fs < 0.97) { rp.style.setProperty('--fs', 0.97); return; }
    for (i = 0; i < 9; i++) { var mid = (lo + hi) / 2; rp.style.setProperty('--k', mid); if (fits()) lo = mid; else hi = mid; }
    rp.style.setProperty('--k', Math.max(0.5, lo * 0.985));
  }
  function fitAll(root) { [].forEach.call((root || document).querySelectorAll('.rp'), fitPage); }
  var fitT = null; if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { fitSoon(ov()); });
  function fitSoon(root) { clearTimeout(fitT); fitT = setTimeout(function () { fitAll(root); }, 60); }
  function draw() {
    var o = ov(); if (!o) return; var L = exams(), staff = isStaff();
    var it0 = L.filter(function (x) { return x.m.id === V.ex; })[0] || L[L.length - 1];
    if (it0) {
      var nd = needEss(L), np = NT[it0.m.id] === undefined;
      if (nd.length || np) { Promise.all(nd.map(essOf).concat(np ? [notesOf(it0.m.id)] : [])).then(function () { if (ov()) draw(); }); if (!o.querySelector('.vw')) o.innerHTML = '<div class="rb"><b>📄 성적표</b><span class="sp"></span><button class="g" data-rpt="close">닫기</button></div><div class="msg">성적표를 만드는 중…</div>'; return; }
    }
    if (!L.length) { o.innerHTML = '<div class="rb"><b>성적표</b><span class="sp"></span><button class="g" data-rpt="close">닫기</button></div><div class="msg">아직 채점된 시험이 없어요.</div>'; return; }
    if (!V.ex || L.map(function (x) { return x.m.id; }).indexOf(V.ex) < 0) { var nm = L.filter(function (x) { return msCatOf(x) === '내모미션'; }); V.ex = (nm.length ? nm[nm.length - 1] : L[L.length - 1]).m.id; }
    var it = L.filter(function (x) { return x.m.id === V.ex; })[0];
    var h = '<div class="rb"><b>📄 성적표</b><select data-rpt="ex">' + L.slice().reverse().map(function (x) { return '<option value="' + x.m.id + '"' + (x.m.id === V.ex ? ' selected' : '') + '>' + esc(String(x.ex.name)) + '</option>'; }).join('') + '</select>' +
      '<select data-rpt="mode">' + [['both', '이번 회차 + 누적'], ['ex', '이번 회차만'], ['cum', '누적 성적표만']].map(function (x) { return '<option value="' + x[0] + '"' + (V.mode === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select><span class="sp"></span>' +
      (staff ? '<button data-rpt="save">코멘트 저장' + (dirtyN() ? ' (' + dirtyN() + ')' : '') + '</button><button data-rpt="pdf">PDF 저장 (여백 없음)</button>' : '') + '<button class="g" data-rpt="close">닫기</button></div>';
    var pages = '', cnt = 0, rs = [];
    if (staff) {
      rs = stuList(it);
      if (V.onlySid && !V.selInit) { rs.forEach(function (r) { V.sel[r.k] = (r.k === V.onlySid); }); V.selInit = true; }
      h += '<div class="pk"><b style="font-size:13px">학생</b><button data-rpt="all1" style="border:1px solid #2f4a3c;background:#fff;color:#2f4a3c;border-radius:8px;padding:3px 10px;font-weight:700;cursor:pointer">전체 선택</button><button data-rpt="all0" style="border:1px solid #5d604f;background:#fff;color:#3c3f35;border-radius:8px;padding:3px 10px;cursor:pointer">전체 해제</button>' +
        rs.map(function (r) { var on = V.sel[r.k] !== false && !(V.onlySid && V.sel[r.k] === undefined); return '<label class="' + (on ? 'on' : '') + '"><input type="checkbox" data-rpt="chk" data-k="' + esc(r.k) + '"' + (on ? ' checked' : '') + '>' + esc(r.name || r.nick || '') + '</label>'; }).join('') + '<span class="rp-mut" style="margin-left:auto">글 상자(AI 분석·처방·한마디)는 눌러서 고칠 수 있어요</span></div>';
      rs.forEach(function (r) { if (V.sel[r.k] === false || (V.onlySid && V.sel[r.k] === undefined)) return; cnt++; pages += pagesHtml(r.name || r.nick || '', r.k, calc(it, r, r.k)); });
      if (!cnt) pages = '<div class="msg">성적표를 만들 학생을 체크해 주세요.</div>';
    } else {
      var row = rowOf(it, null);
      pages = row ? pagesHtml((me().name || '나'), null, calc(it, row, null)) : '<div class="msg">이 회차는 내 기록이 아직 없어요.</div>';
    }
    if (!pages) pages = '<div class="msg">이 구성으로 보여줄 내용이 없어요. (누적 성적표는 동형·과제 회차에서 볼 수 있어요)</div>';
    var keep = o.querySelector('.vw'), top = keep ? keep.scrollTop : 0;
    o.innerHTML = h + '<div class="vw">' + pages + '</div>';
    var vw = o.querySelector('.vw'), z = Math.max(0.62, Math.min(1, (vw.clientWidth - 16) / 794));
    if (z < 1) [].forEach.call(vw.querySelectorAll('.pgw'), function (p) { p.style.zoom = z; });
    vw.scrollTop = top;
    V.imgP = fillImgs(vw);
    fitAll(vw); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitAll(vw); });
  }
  function load(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('도구를 불러오지 못했어요(인터넷 연결 확인)')); }; document.head.appendChild(s); }); }
  async function saveNotes(btn) {
    var ks = Object.keys(DR); if (!ks.length) { alert('바뀐 글이 없어요.'); return; }
    var ok = 0, err = ''; btn.disabled = true;
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i], p = k.split('|'), ex = p[0], sid = p[1], f = DR[k];
      if (!sid) continue;
      var j = await callApi('ac_rptn', 'set', { exam_id: ex, sid: sid, f: f });
      if (j && j.ok) { NT[ex] = NT[ex] || {}; var row = NT[ex][sid] = NT[ex][sid] || {}; Object.keys(f).forEach(function (ff) { if (f[ff] == null) delete row[ff]; else row[ff] = f[ff]; }); delete DR[k]; ok++; }
      else err = (j && j.error) || '저장 실패';
    }
    btn.disabled = false;
    if (err) alert((ok ? ok + '명 저장했어요.\n' : '') + '⚠ 저장하지 못했어요: ' + err + '\n(서버에 83_성적표_코멘트_서버.sql 을 실행했는지 확인해 주세요. 실행 전에는 이 화면에서 PDF 저장까지만 반영돼요)');
    else alert('코멘트를 저장했어요. 학생 화면에도 수정한 글이 나와요.');
    draw();
  }
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
        var cl = pgs[i].cloneNode(true); cl.classList.add('cap'); [].forEach.call(cl.querySelectorAll('[contenteditable]'), function (e) { e.removeAttribute('contenteditable'); }); host.appendChild(cl); document.body.appendChild(host);
        var c; try { await new Promise(function (r) { setTimeout(r, 120); }); var rc = host.getBoundingClientRect(); c = await html2canvas(cl, { scale: 2, backgroundColor: '#fbfaf5', useCORS: true, width: Math.round(rc.width), height: Math.round(rc.height), logging: false }); } finally { host.remove(); }
        if (!doc) doc = new J({ orientation: 'portrait', unit: 'mm', format: [210, 297] }); else doc.addPage([210, 297], 'portrait');
        doc.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
      var it = exams().filter(function (x) { return x.m.id === V.ex; })[0];
      doc.save('공수내모_성적표_' + String(it ? (it.m.short || it.ex.name) : '').replace(/[\\/:*?"<>|]/g, '') + '.pdf');
    } catch (e) { alert('저장 실패: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = orig; }
  }
  window.rptOpen = function (id, tries, opt) {
    if (typeof id === 'string' && id) { V.ex = id; V.any = true; }
    if (!MS || !MS.items) { try { msEnsure(); } catch (e) {} tries = (tries || 0) + 1; if (tries > 60) { alert('미션을 불러오지 못했어요. 잠깐 뒤에 다시 눌러 주세요.'); return; } setTimeout(function () { window.rptOpen(null, tries, opt); }, 400); return; }
    if (opt !== undefined || typeof id === 'string') { V.mode = (opt && opt.mode) || 'both'; V.onlySid = (opt && opt.sid) || null; V.selInit = false; }
    ensureCss(); var o = ov(); if (o) o.remove(); o = document.createElement('div'); o.id = 'rptOv'; o.className = 'rpov'; document.body.appendChild(o); V.sel = {}; ESS = {}; NT = {}; DR = {}; draw();
  };
  window.rptCard = function () {
    if (!MS || !MS.items || !exams().length) return '';
    var st = isStaff();
    return '<div class="card" style="border-left:4px solid #b76e79;background:#fbf3f4;margin-bottom:12px"><div class="row"><div><b>' + (st ? '성적표 만들기 · PDF 저장' : '내 성적표 보기') + '</b><div class="muted sm">' + (st ? '정오표를 입력하면 바로 만들어져요. 회차를 고르고 학생을 체크해서 여백 없는 A4 PDF로 저장해요. AI 분석·처방·한마디는 눌러서 고칠 수 있어요.' : '점수 · 등급 · 문항별 분석 · 학습 처방 · 누적 성적을 볼 수 있어요.') + '</div></div><span class="sp"></span><button class="btn" data-rpt="open" type="button">' + (st ? '성적표 열기' : '성적표 보기') + '</button></div></div>';
  };
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-rpt]') : null; if (!t) return; var a = t.getAttribute('data-rpt');
    if (a === 'open') { ev.preventDefault(); window.rptOpen(null, 0, { mode: 'both' }); }
    else if (a === 'view') { ev.preventDefault(); window.rptOpen(t.getAttribute('data-id'), 0, { mode: 'ex', sid: t.getAttribute('data-sid') || null }); }
    else if (a === 'close') { var o = ov(); if (o) o.remove(); }
    else if (a === 'pdf') pdf(t);
    else if (a === 'save') saveNotes(t);
    else if (a === 'reset') { var k = t.getAttribute('data-ex') + '|' + t.getAttribute('data-key'); (DR[k] = DR[k] || {})[t.getAttribute('data-f')] = null; draw(); }
    else if (a === 'all1' || a === 'all0') { var it = exams().filter(function (x) { return x.m.id === V.ex; })[0]; V.onlySid = null; stuList(it).forEach(function (r) { V.sel[r.k] = a === 'all1'; }); draw(); }
  });
  /* 글 상자 수정 내용 기억 */
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || !t.classList || !t.classList.contains('rp-ed') || !t.getAttribute('contenteditable')) return;
    var k = t.getAttribute('data-ex') + '|' + t.getAttribute('data-key'); (DR[k] = DR[k] || {})[t.getAttribute('data-f')] = t.innerText.replace(/\n$/, '');
    var b = document.querySelector('.rpov [data-rpt="save"]'); if (b) b.textContent = '코멘트 저장 (' + dirtyN() + ')'; fitPage(t.closest('.rp'));
  });
  /* 미션 채점 화면(tbmission.html)에서 [성적표 출력]을 누르면 index.html?rpt=<미션 id> 로 와서 바로 성적표를 열어요 */
  try {
    var q = new URLSearchParams(location.search).get('rpt');
    if (q) { var n = 0, iv = setInterval(function () { n++; var ok = false; try { ok = !!(S && S.uid && U[S.uid]); } catch (e) {} if (ok) { clearInterval(iv); window.rptOpen(q, 0, { mode: 'both' }); } else if (n > 100) clearInterval(iv); }, 300); }
  } catch (e) {}
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return; var a = t.getAttribute('data-rpt');
    if (a === 'ex') { V.ex = t.value; draw(); }
    else if (a === 'mode') { V.mode = t.value; draw(); }
    else if (a === 'chk') { V.onlySid = null; V.sel[t.getAttribute('data-k')] = !!t.checked; draw(); }
  });
})();
